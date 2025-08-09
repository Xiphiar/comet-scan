import { FC, useEffect, useMemo } from "react";
import { Delegation } from "@comet-scan/types";
import useConfig from "../../hooks/useConfig";
import { Link, useParams } from "react-router-dom";
import ValidatorAvatar from "../Avatar/KeybaseAvatar";
import { weiFormatNice } from "../../utils/coin";

type Props = {
    delegation: Delegation
}
const DelegationRow: FC<Props> = ({delegation}) => {
    const {getChain, getValidators, fetchValidators} = useConfig();
    const { chain: chainLookupId } = useParams();
    const chain = getChain(chainLookupId);
    const chainValidators = getValidators(chain.chainId);

    useEffect(()=>{
        if (!chainValidators) fetchValidators(chain.chainId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainLookupId])

    const validator = useMemo(()=>{
        const validator = chainValidators?.find(val => val.operatorAddress === delegation.validatorAddress);
        return validator
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainLookupId, delegation, chainValidators])
    const latestValidatorDescription = validator?.descriptions.length ? validator.descriptions[0] : undefined

    return (
        <Link to={`/${chainLookupId}/validators/${validator?.operatorAddress}`} className='dataRow'>
            <div className='col col-6 flex-row align-items-center gap-2'>
                <ValidatorAvatar
                    avatarUrl={latestValidatorDescription?.keybaseAvatarUrl}
                    moniker={latestValidatorDescription?.moniker}
                    operatorAddress={validator?.operatorAddress}
                />
                {latestValidatorDescription?.moniker || validator?.operatorAddress || 'Unknown'}
            </div>
            {/* TODO display bond status */}
            <div className='col col-6 align-items-end'>
                {weiFormatNice(delegation.amount, chain.bondingDecimals)} {chain.bondingDisplayDenom}
            </div>
        </Link>
    )
}

export default DelegationRow;