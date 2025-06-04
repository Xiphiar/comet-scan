import { FC, useEffect, useMemo, useState } from "react";
import styles from './ProposalMessageCard.module.scss';
import { Proposal } from "../../interfaces/models/proposals.interface";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import { v1beta1LcdProposal, v1LcdProposal } from "../../interfaces/lcdProposalResponse";
import { formatProposalType } from "../../utils/format";
import parseProposalMessage from "./parseProposalMessage";
import Spinner from "../../components/Spinner";

type Props = {
    proposal: Proposal,
    messageIndex: number,
}
const ProposalMessageCard: FC<Props> = ({proposal, messageIndex}) => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const config = getChain(chainLookupId);
    const [kvPairs, setKvPairs] = useState<Array<[string, any]>>(undefined);

    const content = useMemo(()=>{
        if (config.govVersion === 'v1beta1') {
            return (proposal.proposal as v1beta1LcdProposal).content;
        } else if (config.govVersion === 'v1') {
            const messages = (proposal.proposal as v1LcdProposal).messages;
            if (!messages.length) return undefined;
            if (!messages[messageIndex]) return undefined;
            return messages[0]; 
        }
    }, [config.govVersion, messageIndex, proposal.proposal]);

    useEffect(()=>{
        if (!content) return;
        (async()=>{
            setKvPairs(await parseProposalMessage(config, content))
        })()
    }, [config, content])

    if (!content) return <></>;

    return (
        <div className={styles.proposalMessageCard}>
            <h4>#{messageIndex + 1} {formatProposalType(content['@type'])}</h4>
            { kvPairs === undefined &&
                <div className='w-full px-4'>
                    <Spinner />
                </div>
            }
            {(kvPairs || []).map(([key, value], i) =>
                <div className='d-flex flex-wrap' key={`${key}-${i}`}>
                    <div className='col-12 col-md-3' style={{fontWeight: 600}}>{key}</div>
                    <div className='col'>{value}</div>
                </div>
            )}
        </div>
    )
}

export default ProposalMessageCard;