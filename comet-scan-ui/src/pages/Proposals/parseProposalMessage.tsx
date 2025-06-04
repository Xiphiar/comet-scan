import { ReactNode } from "react";
import { formatCoins } from "../../utils/format";
import { defaultKeyContent } from "../../utils/messageParsing";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { Link } from "react-router-dom";

const parseProposalMessage = async (config: FrontendChainConfig, content: any): Promise<[string, string | ReactNode][]> => {
    switch (content['@type']) {

        case '/cosmos.upgrade.v1beta1.SoftwareUpgradeProposal':
        case '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade': {
            const data: [string, string | ReactNode][] = [
                ['Upgrade Name', content.plan.name]
            ]
            if (content.plan.time !== '0001-01-01T00:00:00Z') data.push(['Upgrade Time', new Date(content.plan.time).toLocaleString()])
            if (content.plan.height && content.plan.height !== '0') data.push([
                'Upgrade Height',
                <Link to={`/${config.id}/blocks/${content.plan.height}`}>{parseInt(content.plan.height).toLocaleString()}</Link>
            ])
            if (content.plan.info) data.push(['Upgrade Info', defaultKeyContent(content.plan.info)])
            return data;
        }

        case '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend':
        case '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal': {
            return [
                ['Recipient', <Link to={`/${config.id}/accounts/${content.recipient}`}>{content.recipient}</Link>],
                ['Amount', await formatCoins(content.amount, config)]
            ]
        }

        case '/cosmos.params.v1beta1.ParameterChangeProposal': {
            return [
                ['Changes',
                    <div>
                        <div className='d-flex'>
                            <div className='col col-6 fw-bold'>Subspace and Key</div>
                            <div className='col col-6 fw-bold'>New Value</div>
                        </div>
                        {content.changes.map(change => {
                            return(
                                <div key={`${change.subspace}${change.key}${change.value}`} className='d-flex'>
                                    <div className='col col-6'>{change.subspace}/{change.key}</div>
                                    <div className='col col-6'>{defaultKeyContent(change.value)}</div>
                                </div>
                            )
                        })}
                    </div>
                ],
            ]
        }

        // TODO Compare with existing params, and only display params that are changing
        case '/cosmos.distribution.v1beta1.MsgUpdateParams':
        case '/secret.compute.v1beta1.MsgUpdateParams':
        case '/cosmos.gov.v1.MsgUpdateParams': {
            const changes: [string, string][] = [];
            const paramNames = Object.keys(content.params);
            paramNames.forEach(param => {
                let value = content.params[param];
                if (typeof value === 'object' || typeof value === 'boolean') value = JSON.stringify(value);
                changes.push([param, value])
            })
            return [
                ['Authority', <Link to={`/${config.id}/accounts/${content.authority}`}>{content.authority}</Link>],
                [
                    'Changes',
                    // TODO display the changes table on a new row
                    <div>
                        <div className='d-flex mb-1'>
                            <div className='col col-6 text-decoration-underline'>Param</div>
                            <div className='col col-6 text-decoration-underline'>New Value</div>
                        </div>
                        {changes.map(change => {
                            return(
                                <div key={`${change[0]}${change[1]}`} className='d-flex'>
                                    <div className='col col-6'>{change[0]}</div>
                                    <div className='col col-6 overflow-auto'>{defaultKeyContent(change[1])}</div>
                                </div>
                            )
                        })}
                    </div>
                ],
            ]
        }

        case '/cosmos.consensus.v1.MsgUpdateParams': {
            const changes: [string, string][] = [];
            const {authority, abci, ...spaces} = content;
            const subspaceNames = Object.keys(spaces);

            subspaceNames.forEach(subspace => {
                if (subspace === '@type') return;

                const keys = Object.keys(spaces[subspace]);
                keys.forEach(key => {
                    const value = spaces[subspace][key];
                    changes.push([`${subspace}/${key}`, value])
                })
            })
            return [
                ['Authority', <Link to={`/${config.id}/accounts/${authority}`}>{authority}</Link>],
                [
                    'Changes',
                    <div>
                        <div className='d-flex mb-1'>
                            <div className='col col-6 text-decoration-underline'>Subspace and Key</div>
                            <div className='col col-6 text-decoration-underline'>New Value</div>
                        </div>
                        {changes.map(change => {
                            return(
                                <div key={`${change[0]}${change[1]}`} className='d-flex'>
                                    <div className='col col-6'>{change[0]}</div>
                                    <div className='col col-6'>{defaultKeyContent(change[1])}</div>
                                </div>
                            )
                        })}
                    </div>
                ],
            ]
        }

        case '/ibc.core.client.v1.MsgRecoverClient':
        case '/ibc.core.client.v1.ClientUpdateProposal': {
            return [
                ['Expired Client', content.subject_client_id],
                ['New Client', content.substitute_client_id],
            ]
        }

        // If unknown, just return the raw KV pairs as strings
        default: {
            console.log(`Unknown Proposal Type ${content['@type']}:`, content);
            const entries = [];
            for (const [key, value] of Object.entries(content)) {
                if (typeof value === 'object') {
                    entries.push([
                        key,
                        defaultKeyContent(JSON.stringify(value)),
                    ])
                } else {
                    entries.push([key, defaultKeyContent(value)])
                }
            }
            return entries;
        }
    }

}

export default parseProposalMessage;