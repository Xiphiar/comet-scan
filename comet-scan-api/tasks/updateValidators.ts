import { Validator as SJSValidator } from "secretjs/dist/grpc_gateway/cosmos/staking/v1beta1/staking.pb";
import { getSecretWasmClient } from "../common/cosmWasmClient";
import Chains from "../config/chains";
import Validators from "../models/validators";
import { Validator } from "../interfaces/models/validators.interface";
import { base64TendermintPubkeyToValconsAddress, fromBase64, validatorAddressToSelfDelegatorAddress } from "secretjs";
import { getDelegationToValidator } from "../common/chainQueries";

import { sha256 } from "@noble/hashes/sha256";
import { consensusPubkeyToHexAddress } from "../common/addresses";
import { ChainConfig } from "../interfaces/config.interface";
import { importAccount } from "./importAccounts";

export const updateValidatorsForChain = async (chain: ChainConfig) => {
    console.log(`Updating validators on ${chain.chainId}`)
    const client = await getSecretWasmClient(chain.chainId);

    const allValidators: SJSValidator[] = [];
    let nextKey: string | undefined = undefined;
    while (true) {
        const result = await client.query.staking.validators({ pagination: nextKey ? { key: nextKey as any, limit: '100',  } : undefined});
        if (!result.validators?.length) break;
        allValidators.push(...result.validators);

        if (!result.pagination?.next_key) break;
        nextKey = result.pagination.next_key as any as string
    }

    console.log(`Found ${allValidators.length} valudators`);

    for (const validator of allValidators) {
        if (!validator.operator_address) continue;
        console.log(`Importing ${validator.operator_address} ${validator.description?.moniker}`)

        const accountAddress = validatorAddressToSelfDelegatorAddress(validator.operator_address, chain.prefix);
        const signerAddress = base64TendermintPubkeyToValconsAddress((validator.consensus_pubkey as any).key, chain.prefix);
        const hexAddress = consensusPubkeyToHexAddress(validator.consensus_pubkey);

        const selfBondedAmount = await getDelegationToValidator(chain.chainId, accountAddress, validator.operator_address);

        const existingValidator = await Validators.findOne({operatorAddress: validator.operator_address});
        if (existingValidator) {
            let update: Partial<Validator> = {
                delegatedAmount: validator.tokens,
                delegatorShares: validator.delegator_shares,
                selfBondedAmount,
                status: validator.status as any || 'BOND_STATUS_UNBONDED',
            };

            // TODO check if commission is new and add a document instead of replacing
            if (validator.commission) {
                update = {
                    ...update,
                    commission: {
                        max_change_rate: validator.commission?.commission_rates?.max_change_rate || '0',
                        max_rate: validator.commission?.commission_rates?.max_rate || '0',
                        rates: [{
                            rate: validator.commission?.commission_rates?.rate || '0',
                            updateTime: new Date(validator.commission.update_time as string || 0),
                        }],
                    }
                }
            }

            if (validator.description) {
                const sortedDescriptions = existingValidator.descriptions.sort((a, b) => b.updateTime.valueOf() - a.updateTime.valueOf());
                const newestDescription = sortedDescriptions[0];
                if (
                    validator.description.details !== newestDescription.details
                    || validator.description.identity !== newestDescription.identity
                    || validator.description.moniker !== newestDescription.moniker
                    || validator.description.security_contact !== newestDescription.security_contact
                    || validator.description.website !== newestDescription.website
                ) {
                    update = {
                        ...update,
                        descriptions: [
                            {
                                ...validator.description,
                                updateTime: new Date(),
                            },
                            ...sortedDescriptions,
                        ]
                    }
                }
            }

            await Validators.findByIdAndUpdate(existingValidator._id, update)
        } else {
            const newVal: Validator = {
                chainId: chain.chainId,
                commission: {
                    max_change_rate: validator.commission?.commission_rates?.max_change_rate || '0',
                    max_rate: validator.commission?.commission_rates?.max_rate || '0',
                    rates: [{
                        rate: validator.commission?.commission_rates?.rate || '0',
                        updateTime: new Date(validator.commission?.update_time as string || 0),
                    }]
                },
                consensusPubkey: {
                    //@ts-expect-error
                    type: validator.consensus_pubkey ? validator.consensus_pubkey['@type'] : undefined, 
                    key: (validator.consensus_pubkey as any)?.key,
                },
                descriptions: [{
                    updateTime: new Date(),
                    details: validator.description?.details,
                    identity: validator.description?.identity,
                    moniker: validator.description?.moniker,
                    security_contact: validator.description?.security_contact,
                    website: validator.description?.website,
                }],
                jailingEvents: [],
                status: validator.status as any,
                minimumSelfDelegation: validator.min_self_delegation || '1',
                operatorAddress: validator.operator_address,
                accountAddress,
                signerAddress,
                hexAddress,
                delegatedAmount: validator.tokens || '0',
                delegatorShares: validator.delegator_shares || '0',
                selfBondedAmount,
            };
            await Validators.create(newVal)
        }

        await importAccount(chain.chainId, accountAddress)
    }
}

// let UPDATING = false;
// export const updateValidatorsForAllChains = async () => {
//     if (UPDATING) {
//         console.log('Already updaring all validators');
//         return;
//     };

//     UPDATING = true;

//     for (const chain of Chains) {
//         try {
//             console.log(`Updating validators on ${chain.chainId}`)
//             await updateValidatorsForChain(chain);
//         } catch(e: any) {
//             console.error(`Failed to update validators on ${chain.chainId}:`, e, e.toString())
//         }
//     }

//     UPDATING = false;
// }
