import { getLcdClient } from "../config/clients";
import { ChainConfig } from "../interfaces/config.interface";
import { LcdCosmWasmCodesResponse, LcdCosmWasmContractInfoResponse } from "../interfaces/lcdCosmwasmResponses";
import { WasmCode } from "../interfaces/models/codes.interface";
import { WasmContract } from "../interfaces/models/contracts.interface";
import Codes from "../models/codes.model";
import Contracts from "../models/contracts.model";
import Transactions from "../models/transactions";

export const updateCosmWasmContracts = async (config: ChainConfig) => {
    console.log('Updating Wasm Contracts on', config.chainId);
    const lcdClient = getLcdClient(config.chainId);
    const data = await lcdClient.get<LcdCosmWasmCodesResponse>(`/cosmwasm/wasm/v1/code?pagination.limit=1000`);

    if (!data?.code_infos?.length) return;

    // Import codes
    for (const code of data.code_infos) {
        console.log(`Importing CosmWasm code ${code.code_id} on ${config.chainId}`)
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

        const contractsResponse = await lcdClient.get<any>(`/cosmwasm/wasm/v1/code/${code.codeId}/contracts`);
        const contracts: string[] = contractsResponse.contracts;
        for (const contractAddress of contracts) {
            await importCosmWasmContract(config, contractAddress);
        }
        
    } catch(err: any) {
        console.error(`Error updating contracts for code ID ${code.codeId} on ${config.chainId}`)
    }
}

export const importCosmWasmContract = async (config: ChainConfig, contractAddress: string): Promise<WasmContract> => {
    const lcdClient = getLcdClient(config.chainId);
    const data = await lcdClient.get<LcdCosmWasmContractInfoResponse>(`/cosmwasm/wasm/v1/contract/${contractAddress}`);

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