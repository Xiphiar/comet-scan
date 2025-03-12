import axios from "axios";
import Chains from "../config/chains";
import { Amount, StakingMetrics } from "../interfaces/responses/explorerApiResponses";
import Validators from "../models/validators";
import { getSecretWasmClient } from "./cosmWasmClient";
import { Cache } from "./cache";
import { NftContractInfoResponse, TokenInfoResponse } from "../interfaces/secretQueryResponses";
import { Coin } from "../interfaces/models/blocks.interface";

export const getTotalSupply = async (chainId: string): Promise<Amount> => {
    const chainConfig = Chains.find(c => c.chainId === chainId);
    if (!chainConfig) throw `Chain ${chainId} not found in config.`

    const cached = Cache.get<Amount>(`${chainId}-total-supply`);
    if (cached) return cached;

    // const {data: _data} = await axios.get(`${chainConfig.lcds[0]}/cosmos/bank/v1beta1/supply/by_denom?denom=${chainConfig.bondingDenom}`);
    const {data: _data}: { data: { supply: Coin[] }} = await axios.get(`${chainConfig.lcds[0]}/cosmos/bank/v1beta1/supply`, {
        params: {
            'pagination.limit': 1000,
        }
    });
    const bondingDenom = _data.supply.find((d: any) => d.denom === chainConfig.bondingDenom);
    const data = {
        amount: bondingDenom?.amount || '0',
        denom: chainConfig.bondingDenom,
        denomDecimals: chainConfig.bondingDecimals,
    }
    Cache.set(`${chainId}-total-supply`, data, 300);
    return data;
}

export const getTotalBonded = async (chainId: string): Promise<Amount> => {
    const chainConfig = Chains.find(c => c.chainId === chainId);
    if (!chainConfig) throw `Chain ${chainId} not found in config.`

    const cached = Cache.get<Amount>(`${chainId}-total-bonded`);
    if (cached) return cached;

    const client = await getSecretWasmClient(chainConfig.chainId);

    const response = await client.query.staking.pool({});

    const data = {
        amount: response.pool?.bonded_tokens || '0',
        denom: chainConfig.bondingDenom,
        denomDecimals: chainConfig.bondingDecimals,
    }
    
    Cache.set(`${chainId}-total-bonded`, data, 300);
    return data;
}

export const getInflation = async (chainId: string): Promise<number> => {
    try {
        const chainConfig = Chains.find(c => c.chainId === chainId);
        if (!chainConfig) throw `Chain ${chainId} not found in config.`

        const cached = Cache.get<number>(`${chainId}-inflation`);
        if (cached) return cached;

        const client = await getSecretWasmClient(chainConfig.chainId);

        const response = await client.query.mint.inflation({}) as unknown as { inflation: string };

        const data = parseFloat(response.inflation || '0');
        Cache.set(`${chainId}-inflation`, data, 3600);
        return data;
    } catch(e: any) {
        console.error(`Error getting inflation on ${chainId}:`, e)
        return 0;
    }
}

// export const getActiveProposals = async (chainId: string) => {
//     const chainConfig = Chains.find(c => c.chainId === chainId);
//     if (!chainConfig) throw `Chain ${chainId} not found in config.`

//     const client = await getSecretWasmClient(chainConfig.chainId);

//     const response = await client.query.gov.proposals({proposal_status: 2 as any});
//     return (response.proposals || []);
// }

// export const getTopActiveValidators = async (chainId: string) => {
//     const chainConfig = Chains.find(c => c.chainId === chainId);
//     if (!chainConfig) throw `Chain ${chainId} not found in config.`

//     const client = await getSecretWasmClient(chainConfig.chainId);

//     const response = await client.query.staking.validators({ status: 'BOND_STATUS_BONDED' });
//     return (response.validators || []);
// }

export const getDelegationToValidator = async (chainId: string, delegator_addr: string, validator_addr: string): Promise<string> => {
    try {
        const chainConfig = Chains.find(c => c.chainId === chainId);
        if (!chainConfig) throw `Chain ${chainId} not found in config.`

        const client = await getSecretWasmClient(chainConfig.chainId);

        const data = await client.query.staking.delegation({delegator_addr, validator_addr});
        return data.delegation_response?.balance?.amount || '0';
    } catch (err: any) {
        if (err.code === 5 && err.message.includes('not found for validator')) return '0';
        else throw err;
    }
}

export const getStakingMetrics = async (chainId: string): Promise<StakingMetrics> => {
    const cached = Cache.get<StakingMetrics>(`${chainId}-staking-metrics`);
    if (cached) return cached;

    const chainConfig = Chains.find(c => c.chainId === chainId);
    if (!chainConfig) throw `Chain ${chainId} not found in config.`

    const client = await getSecretWasmClient(chainConfig.chainId);

    const supply = await getTotalSupply(chainId);

    // APR Calculation //
    const inflationRate = await getInflation(chainId);

    // const mintProvisions = await client.query.mint.annualProvisions({});
    // const annualProvisions = Number(mintProvisions.annual_provisions);
    const annualProvisions = Number(supply.amount) * inflationRate;

    const mintParams = await client.query.mint.params({});
    const blocksPerYear =  Number(mintParams.params?.blocks_per_year); //string

    const bonded = await getTotalBonded(chainId);

    const distributionParams = await client.query.distribution.params({});
    const communityTax = Number(distributionParams.params?.community_tax); //string

    const nominalApr = (annualProvisions * (1 - communityTax) / Number(bonded.amount));
    // End APR Calculation //

    const stakingParams = await client.query.staking.params({});

    const activeValidators = await Validators.countDocuments({ chainId, status: 'BOND_STATUS_BONDED' });


    const supplyBigInt = BigInt(supply.amount);
    const bondedBigInt = BigInt(bonded.amount);
    const bondRate = Number(bondedBigInt * 10000n / supplyBigInt) / 10000;

    const data = {
        activeValidators,
        bonded,
        bondRate,
        inflationRate,
        nominalApr,
        communityPoolTax: parseFloat(distributionParams.params?.community_tax || '0'),
        unbondingPeriodSeconds: parseInt(stakingParams.params?.unbonding_time ? (stakingParams.params?.unbonding_time as string).slice(0, -1) : '0'),
    }
    Cache.set(`${chainId}-staking-metrics`, data);
    return data;
}


export interface DenomTraceResponse {
    denom_trace: {
        path: string;
        base_denom: string;
    }
}

export const getDenomTrace = async (chainId: string, denomHash: string): Promise<string> => {
    try {
        const key = `${chainId}-denom-trace-${denomHash}`;

        const chainConfig = Chains.find(c => c.chainId === chainId);
        if (!chainConfig) throw `Chain ${chainId} not found in config.`

        const cached = Cache.get<string>(key);
        if (cached) return cached;

        const cleanHash = denomHash.replace('ibc/', '');
        const url = `${chainConfig.lcds[0]}/ibc/${chainConfig.ibcVersion === 'v1' ? 'apps' : 'applications'}/transfer/${chainConfig.ibcVersion}/denom_traces/${cleanHash}`;
        const {data} = await axios.get<DenomTraceResponse>(url);
        const denom = data.denom_trace.base_denom;
        
        Cache.set(key, denom);
        return denom;
    } catch (err: any) {
        console.error(`Failed to get Denom Trace on ${chainId}:`, err.toString());
        throw err;
    }
}

export const getSecretTokenInfo = async (chainId: string, contract_address: string, code_hash?: string): Promise<TokenInfoResponse> => {
    const client = await getSecretWasmClient(chainId);

    const query = {
        token_info: {},
    };

    const result: TokenInfoResponse | string = await client.query.compute.queryContract({
        contract_address,
        code_hash,
        query,
    });

    if (typeof result === 'string') throw result;
    return result;
}

export const getSecretTokenPermitSupport = async (chainId: string, contract_address: string, code_hash?: string): Promise<boolean> => {
    const client = await getSecretWasmClient(chainId);

    const query = {
        fake_query_that_should_not_exist_z_z_a: {},
    };

    const result: unknown = await client.query.compute.queryContract({
        contract_address,
        code_hash,
        query,
    });
    if (typeof result === 'string' && result.includes('with_permit')) return true;
    else return false;
}

export const getSecretNftContractInfo = async (chainId: string, contract_address: string, code_hash?: string): Promise<NftContractInfoResponse> => {
    const client = await getSecretWasmClient(chainId);

    const query = {
        num_tokens: {},
    };

    const result: NftContractInfoResponse | string = await client.query.compute.queryContract({
        contract_address,
        code_hash,
        query,
    });

    if (typeof result === 'string') throw result;
    return result;
}

export const getSecretNftTokenCount = async (chainId: string, contract_address: string, code_hash?: string): Promise<number> => {
    const client = await getSecretWasmClient(chainId);

    const query = {
        contract_info: {},
    };

    const result: { num_tokens: { count: number }} = await client.query.compute.queryContract({
        contract_address,
        code_hash,
        query,
    });

    if (typeof result === 'string') throw result;
    return result.num_tokens.count;;
}