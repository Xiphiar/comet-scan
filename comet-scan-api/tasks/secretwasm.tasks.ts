import { CodeInfoResponse, ContractInfoWithAddress } from "secretjs/dist/grpc_gateway/secret/compute/v1beta1/query.pb";
import { getSecretTokenInfo, getSecretNftTokenCount, getSecretTokenPermitSupport, getSecretNftContractInfo } from "../common/chainQueries";
import { getSecretWasmClient } from "../common/cosmWasmClient";
import { ChainConfig } from "../interfaces/config.interface";
import { WasmCode } from "../interfaces/models/codes.interface";
import { WasmContract } from "../interfaces/models/contracts.interface";
import { TokenInfoResponse, NftContractInfoResponse } from "../interfaces/secretQueryResponses";
import Codes from "../models/codes.model";
import Contracts from "../models/contracts.model";
import Transactions from "../models/transactions";

// Import all codes and contracts for a given chain. Run on a schedule.
export const updateSecretWasmContracts = async (config: ChainConfig) => {
    console.log('Updating Secret Wasm Contracts on', config.chainId);
    const client = await getSecretWasmClient(config.chainId);
    const codes = await client.query.compute.codes({})
    if (!codes?.code_infos?.length) return;
    console.log(`Found ${codes.code_infos.length} codes to import on ${config.chainId}`);

    const codesInDb: string[] = (await Codes.find({ chainId: config.chainId }).select({ codeId: 1 }).lean()).map(doc => doc.codeId)

    // Import codes
    for (const code of codes.code_infos) {
        if (!code.code_id || !code.code_hash) continue;
        if (codesInDb.includes(code.code_id)) continue;
        await importSecretWasmCode(config.chainId, code.code_id, code)
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

// Import a specific code by code ID
export const importSecretWasmCode = async (chainId: string, codeId: string, codeInfo?: CodeInfoResponse): Promise<WasmCode> => {
    const existingCode = await Codes.findOne({ chainId: chainId, codeId }).lean();
    if (existingCode) return existingCode;

    console.log(`Importing code ${codeId} on ${chainId}`)
    if (!codeInfo) {
        const client = await getSecretWasmClient(chainId);
        const _codeInfo = await client.query.compute.code({ code_id: codeId });
        codeInfo = _codeInfo.code_info;
    }

    if (!codeInfo?.code_id) throw `codeInfo.code_id is undefined`;
    if (!codeInfo?.code_hash) throw `codeInfo.code_hash is undefined`;

    // TODO maybe stote the code size. Would need an additional query though since the actual code isn't returned in the all codes response.
    const dbCode: WasmCode = {
        chainId,
        codeId: codeInfo!.code_id,
        codeHash: codeInfo!.code_hash,
        source: codeInfo!.source,
        builder: codeInfo!.builder,
        creator: codeInfo!.creator,
    };
    await Codes.findOneAndReplace({ chainId, codeId: codeInfo!.code_id }, dbCode, { upsert: true });
    return dbCode;
}

interface ImportSecretWasmContractParams {
    checkToken: boolean;
    checkNft: boolean;
}
const DefaultImportSecretWasmContractParams: ImportSecretWasmContractParams = {
    checkToken: true,
    checkNft: true,
}
export const importSecretWasmContract =
    async (chainId: string, contractAddress: string, contractInfo?: ContractInfoWithAddress, code?: WasmCode, params = DefaultImportSecretWasmContractParams):
    Promise<{isToken: boolean, isNft: boolean}> =>
{
    console.log(`Importing contract ${contractAddress} on ${chainId}`);
    if (!contractInfo) {
        const client = await getSecretWasmClient(chainId);
        const contractInfoResponse = await client.query.compute.contractInfo({ contract_address: contractAddress });
        contractInfo = contractInfoResponse;
    }
    if (!contractInfo.contract_info) throw `contract_info is undefined for contract ${contractAddress} on ${chainId}`;
    if (!contractInfo.contract_info.code_id) throw `contract_info.code_id is undefined for contract ${contractAddress} on ${chainId}`;
    if (!contractInfo.contract_address) throw `contract_address is undefined for contract ${contractAddress} on ${chainId}`;
    const {contract_address, contract_info} = contractInfo;
    if (!code) {
        const _code = await Codes.findOne({ chainId: chainId, codeId: contract_info.code_id }).lean();
        if (!_code) {
            code = await importSecretWasmCode(chainId, contract_info.code_id!)
        } else {
            code = _code
        }
    }

    const existingContract = await Contracts.findOne({ chainId: chainId, contractAddress: contract_address }).lean();

    if (existingContract) {
        const executions = await Transactions.find({ chainId, executedContracts: contract_address }).countDocuments();

        let update: Partial<WasmContract> = {
            codeId: contract_info.code_id,
            admin: contract_info.admin,
            executions,
        }

        // Update token total supply
        if (existingContract.tokenInfo) {
            const tokenInfo = await getSecretTokenInfo(chainId, contract_address, code.codeHash);
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
            const numTokens = await getSecretNftTokenCount(chainId, contract_address, code.codeHash);
            update = {
                ...update,
                nftInfo: {
                    ...existingContract.nftInfo,
                    numTokens,
                }
            }
        }

        await Contracts.findByIdAndUpdate(existingContract._id, { $set: update });

        return {
            isToken: !!existingContract.tokenInfo,
            isNft: !!existingContract.nftInfo,
        }
    } else {
        /////////////////////////
        // Insert new contract //
        /////////////////////////

        let isToken = false;
        let isNft = false;

        // Check if Token
        let tokenInfo: TokenInfoResponse | undefined = undefined;
        let permitSupport = false;
        if (params.checkToken) try {
            tokenInfo = await getSecretTokenInfo(chainId, contract_address, code.codeHash);
            permitSupport = await getSecretTokenPermitSupport(chainId, contract_address, code.codeHash);
            isToken = true;
        } catch {
            isToken = false;
        }

        // Check if NFT
        let nftInfo: NftContractInfoResponse | undefined = undefined;
        let numTokens = 0;
        if (!tokenInfo && params.checkNft) try {
            nftInfo = await getSecretNftContractInfo(chainId, contract_address, code.codeHash);
            isNft = true;

            // Get number of NFTs in collection, but this might be private so ignore any errors.
            try {
                numTokens = await getSecretNftTokenCount(chainId, contract_address, code.codeHash);
            } catch {};
        } catch {
            isNft = false
        }

        // Get count of transactions that executed this contract
        const executions = await Transactions.find({ chainId, executedContracts: contract_address }).countDocuments();

        const dbContract: WasmContract = {
            chainId,
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
        return { isToken, isNft }
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

    // All contracts with the same code ID will have the same functionality,
    // so we will have the import function check if the first contract is either a token or NFT,
    // then use the returned result to skip any unneeded checks for other contracts with the same code ID.
    let checkToken = noParse ? false : true;
    let checkNft = noParse ? false : true;

    for (const {contract_address, contract_info} of contract_infos) {
        if (!contract_address || !contract_info) continue;
        const { isToken, isNft } = await importSecretWasmContract(config.chainId, contract_address, {contract_address, contract_info}, code, { checkNft, checkToken })
        checkToken = isToken;
        checkNft = isNft;
    }
}