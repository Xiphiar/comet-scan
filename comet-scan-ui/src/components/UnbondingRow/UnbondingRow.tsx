import { FC, useEffect, useMemo } from "react";
import { Delegation, Unbonding } from "../../interfaces/models/accounts.interface";
import useConfig from "../../hooks/useConfig";
import { Link, useParams } from "react-router-dom";
import ValidatorAvatar from "../Avatar/KeybaseAvatar";
import { weiFormatNice } from "../../utils/coin";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { Validator } from "../../interfaces/models/validators.interface";

type Props = {
    unbonding: Unbonding
}
const UnbondingRow: FC<Props> = ({unbonding}) => {
    const {getChain, getValidators, fetchValidators} = useConfig();
    const { chain: chainLookupId } = useParams()

    useEffect(()=>{
        const chain = getChain(chainLookupId);
        const chainValidators = getValidators(chain.chainId);
        if (!chainValidators) fetchValidators(chain.chainId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainLookupId])

    const {validator, chain} = useMemo(()=>{
        const chain = getChain(chainLookupId);
        const chainValidators = getValidators(chain.chainId);
        const validator = chainValidators?.find(val => val.operatorAddress === unbonding.validatorAddress);
        return {validator, chain}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainLookupId, unbonding])
    const latestValidatorDescription = validator?.descriptions.length ? validator.descriptions[0] : undefined

    return (
        <div className='dataRow noHover'>
            <div className='col col-6'>
                <Link to={`/${chainLookupId}/validators/${validator?.operatorAddress}`} className='d-flex align-items-center gap-2'>
                    <ValidatorAvatar
                        avatarUrl={latestValidatorDescription?.keybaseAvatarUrl}
                        moniker={latestValidatorDescription?.moniker}
                        operatorAddress={validator?.operatorAddress}
                    />
                    {latestValidatorDescription?.moniker || validator?.operatorAddress || 'Unknown'}
                </Link>
            </div>
            {/* TODO display bond status */}
            <div className='col col-3 col-md-2'>
                {weiFormatNice(unbonding.amount, chain.bondingDecimals)} {chain.bondingDisplayDenom}
            </div>
            <div className='col col-2 d-none d-md-flex'>
                <Link to={`/${chainLookupId}/blocks/${unbonding.creationHeight}`}>{parseInt(unbonding.creationHeight).toLocaleString()}</Link>
            </div>
            <div className='col col-3 col-md-2 align-items-end'>
                {new Date(unbonding.completionTime).toLocaleString()}
            </div>
        </div>
    )
}

export default UnbondingRow;