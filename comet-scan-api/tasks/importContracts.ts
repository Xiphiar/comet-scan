import axios from "axios";
import { getSecretNftContractInfo, getSecretNftTokenCount, getSecretTokenInfo, getSecretTokenPermitSupport } from "../common/chainQueries";
import { getSecretWasmClient } from "../common/cosmWasmClient";
import Chains, { getChainConfig } from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import { WasmCode } from "../interfaces/models/codes.interface";
import { WasmContract } from "../interfaces/models/contracts.interface";
import { NftContractInfoResponse, TokenInfoResponse } from "../interfaces/secretQueryResponses";
import Codes from "../models/codes.model";
import Contracts from "../models/contracts.model";
import Transactions from "../models/transactions";
import { LcdCosmWasmCodesResponse, LcdCosmWasmContractInfoResponse } from "../interfaces/lcdCosmwasmResponses";

const contractImportRunning = new Map<string, boolean>();
const updateContractsForChain = async (config: ChainConfig) => {
    const running = contractImportRunning.get(config.chainId);
    if (running) {
        console.log(`Contract import task already running for ${config.chainId}`)
        return;
    }
    contractImportRunning.set(config.chainId, true);

    try {
        if (config.features.includes('secretwasm')) {
            await updateSecretWasmContracts(config);
        } else if (config.features.includes('cosmwasm')) {
            await updateCosmWasmContracts(config);
        } else {
            console.log(`Skipping contract updates on ${config.chainId}`)
        }

        console.log('Done importing contracts on', config.chainId);
    } catch (err: any) {
        console.error('Failed to import contracts on', config.chainId, err.toString())
        console.trace(err)
    } finally {
        contractImportRunning.set(config.chainId, false);
    }
}

export default updateContractsForChain;

const updateSecretWasmContracts = async (config: ChainConfig) => {
    console.log('Updating Secret Wasm Contracts on', config.chainId);
    const client = await getSecretWasmClient(config.chainId);
    const codes = await client.query.compute.codes({})
    if (!codes?.code_infos?.length) return;
    console.log(`Found ${codes.code_infos.length} codes to import on ${config.chainId}`);

    const codesInDb: string[] = (await Codes.find({ chainId: config.chainId }).select({ codeId: 1 }).lean()).map(doc => doc.codeId)

    // Import codes
    for (const code of codes.code_infos) {
        console.log(`Importing code ${code.code_id} on ${config.chainId}`)
        if (!code.code_id || !code.code_hash) continue;
        // const existingCode = await Codes.findOne({ chainId: config.chainId, codeId: code.code_id }).lean();
        // if (existingCode) continue;
        if (codesInDb.includes(code.code_id)) continue;

        const dbCode: WasmCode = {
            chainId: config.chainId,
            codeId: code.code_id,
            codeHash: code.code_hash,
            source: code.source,
            builder: code.builder,
            creator: code.creator,
        };
        await Codes.findOneAndReplace({ chainId: config.chainId, codeId: code.code_id }, dbCode, { upsert: true });
    }

    if (config.features.includes('no_contract_import')) return;

    // Import Contracts
    const dbCodes = await Codes.find({ chainId: config.chainId }).lean();
    for (const code of dbCodes) try {
        await importSecretWasmContractsByCodeId(config, code.codeId);
    } catch(err: any) {
        console.error(`Error updating contracts for code ID ${code.codeId} on ${config.chainId}:`, err)
    }
}

export const importSecretWasmContractsByCodeId = async (config: ChainConfig, codeId: string) => {
    console.log(`Importing contracts with code ID ${codeId} on ${config.chainId}`);
    const code = await Codes.findOne({ chainId: config.chainId, codeId }).lean();
    if (!code) throw 'Code not yet imported';

    const client = await getSecretWasmClient(config.chainId);
    const {contract_infos} = await client.query.compute.contractsByCodeId({ code_id: code.codeId });
    if (!contract_infos?.length) return;
    console.log(`Found ${contract_infos?.length} contracts with code ID ${code.codeId}`)

    const noParse = config.features.includes('no_contract_parsing')

    let isToken = noParse ? false : true;
    let isNft = noParse ? false : true;

    for (const {contract_address, contract_info} of contract_infos) {
        if (!contract_address || !contract_info) continue;
        // console.log(contract_address, '-', contract_info.label)

        const existingContract = await Contracts.findOne({ chainId: config.chainId, contractAddress: contract_address }).lean();

        if (existingContract) {
            const executions = await Transactions.find({ chainId: config.chainId, executedContracts: contract_address }).countDocuments();

            let update: Partial<WasmContract> = {
                codeId: contract_info.code_id,
                admin: contract_info.admin,
                executions,
            }

            // Update token total supply
            if (existingContract.tokenInfo) {
                const tokenInfo = await getSecretTokenInfo(config.chainId, contract_address, code.codeHash);
                update = {
                    ...update,
                    tokenInfo: {
                        ...existingContract.tokenInfo,
                        totalSupply: tokenInfo.token_info.total_supply,
                    }
                }
            }

            // Update NFT count
            if (existingContract.nftInfo) {
                const numTokens = await getSecretNftTokenCount(config.chainId, contract_address, code.codeHash);
                update = {
                    ...update,
                    nftInfo: {
                        ...existingContract.nftInfo,
                        numTokens,
                    }
                }
            }

            await Contracts.findByIdAndUpdate(existingContract._id, { $set: update });
        } else {
            /////////////////////////
            // Insert new contract //
            /////////////////////////

            // Check if Token
            let tokenInfo: TokenInfoResponse | undefined = undefined;
            let permitSupport = false;
            if (isToken) try {
                tokenInfo = await getSecretTokenInfo(config.chainId, contract_address, code.codeHash);
                permitSupport = await getSecretTokenPermitSupport(config.chainId, contract_address, code.codeHash);
            } catch {
                isToken = false;
            }

            // Check if NFT
            let nftInfo: NftContractInfoResponse | undefined = undefined;
            let numTokens = 0;
            if (!tokenInfo && isNft) try {
                nftInfo = await getSecretNftContractInfo(config.chainId, contract_address, code.codeHash);

                // Get number of NFTs in collection
                try {
                    numTokens = await getSecretNftTokenCount(config.chainId, contract_address, code.codeHash);
                } catch {};
            } catch {
                isNft = false
            }

            // Get count of transactions that executed this contract
            const executions = await Transactions.find({ chainId: config.chainId, executedContracts: contract_address }).countDocuments();

            const dbContract: WasmContract = {
                chainId: config.chainId,
                contractAddress: contract_address,
                codeId: contract_info.code_id || code.codeId,
                creator: contract_info.creator as any as string,
                label: contract_info.label as string,
                admin: contract_info.admin || undefined,
                created: contract_info.created as any || undefined,
                ibc_port_id: contract_info.ibc_port_id || undefined,
                tokenInfo: tokenInfo?.token_info ? {
                    name: tokenInfo.token_info.name,
                    symbol: tokenInfo.token_info.symbol,
                    decimals: tokenInfo.token_info.decimals,
                    totalSupply: tokenInfo.token_info.total_supply || undefined,
                    permitSupport,
                } : undefined,
                nftInfo: nftInfo?.contract_info ? {
                    name: nftInfo.contract_info.name,
                    symbol: nftInfo.contract_info.symbol,
                    numTokens,
                } : undefined,
                executions,
            }

            await Contracts.create(dbContract);
        }
    }
}

const updateCosmWasmContracts = async (config: ChainConfig) => {
    console.log('Updating Wasm Contracts on', config.chainId);
    const {data} = await axios.get<LcdCosmWasmCodesResponse>(`${config.lcd}/cosmwasm/wasm/v1/code?pagination.limit=1000`);

    if (!data?.code_infos?.length) return;

    // Import codes
    for (const code of data.code_infos) {
        console.log(`Importing code ${code.code_id} on ${config.chainId}`)
        const existingCode = await Codes.findOne({ chainId: config.chainId, codeId: code.code_id }).lean();
        if (existingCode) continue;

        if (!code.code_id || !code.data_hash) continue;

        const dbCode: WasmCode = {
            chainId: config.chainId,
            codeId: code.code_id,
            codeHash: code.data_hash,
            source: undefined,
            builder: undefined,
            creator: code.creator,
        };
        await Codes.create(dbCode);
    }

    if (config.features.includes('no_contract_import')) return;

    // Import Contracts
    const dbCodes = await Codes.find({ chainId: config.chainId }).lean();
    for (const code of dbCodes) try {
        console.log(`Importing contracts with code ID ${code.codeId} on ${config.chainId}`)

        const {data: contractsResponse} = await axios.get(`${config.lcd}/cosmwasm/wasm/v1/code/${code.codeId}/contracts`);
        const contracts: string[] = contractsResponse.contracts;
        for (const contractAddress of contracts) {
            await importCosmWasmContract(config, contractAddress);
        }
        
    } catch(err: any) {
        console.error(`Error updating contracts for code ID ${code.codeId} on ${config.chainId}`)
    }
}

export const importCosmWasmContract = async (config: ChainConfig, contractAddress: string): Promise<WasmContract> => {
    const {data} = await axios.get<LcdCosmWasmContractInfoResponse>(`${config.lcd}/cosmwasm/wasm/v1/contract/${contractAddress}`);

    const executions = await Transactions.find({ chainId: config.chainId, executedContracts: contractAddress }).countDocuments();

    const newContract: WasmContract = {
        chainId: config.chainId,
        contractAddress,
        codeId: data.contract_info.code_id,
        creator: data.contract_info.creator,
        label: data.contract_info.label,
        created: data.contract_info.created,
        ibc_port_id: data.contract_info.ibc_port_id,
        admin: data.contract_info.admin,
        tokenInfo: undefined,
        nftInfo: undefined,
        executions,
    };

    return await Contracts.findOneAndReplace(
        { chainId: config.chainId, contractAddress },
        newContract,
        { upsert: true, new: true }
    )
}

export const updateContractsForAllChains = async () => {
    const promises: Promise<void>[] = Chains.map(c => updateContractsForChain(c));
    await Promise.all(promises)
}

const contractExecCountsRunning = new Map<string, boolean>();
const updateExecutedCountsForChain = async (config: ChainConfig) => {
    const running = contractExecCountsRunning.get(config.chainId);
    if (running) {
        console.log(`Contract executed counts task already running for ${config.chainId}`)
        return;
    }
    contractExecCountsRunning.set(config.chainId, true);

    console.log(`Updating contract executed counts on ${config.chainId}`)
    try {
        if (config.features.includes('secretwasm') || config.features.includes('cosmwasm')) {
            const contracts = await Contracts.find({ chainId: config.chainId }).lean();
            for (const {_id, contractAddress} of contracts) {
                const executions = await Transactions.find({ chainId: config.chainId, executedContracts: contractAddress }).countDocuments();
                await Contracts.findByIdAndUpdate(_id, { executions })
            }
        }
        console.log(`Done updating contract executed counts on ${config.chainId}`)
    } catch (err: any) {
        console.error(`Failed to update contract executed counts on ${config.chainId}:`, err, err.toString())
    } finally {
        contractExecCountsRunning.set(config.chainId, false);
    }
}

export const updateContractExecutedCountsForAllChains = async () => {
    for (const chain of Chains) {
        await updateExecutedCountsForChain(chain);
    }
}