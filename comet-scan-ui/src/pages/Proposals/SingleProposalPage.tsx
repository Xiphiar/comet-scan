import { FC, ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { SingleProposalPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleProposalPage } from "../../api/pagesApi";
import ValidatorAvatar from "../../components/Avatar/KeybaseAvatar";
import { formatCoins, formatProposalStatus, formatProposalType, formatTime, formatVoteOption } from "../../utils/format";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { defaultKeyContent } from "../../utils/messageParsing";
import { v1beta1LcdProposal, v1LcdProposal } from "../../interfaces/lcdProposalResponse";
import Spinner from "../../components/Spinner";
import { FaRegClock, FaVoteYea } from "react-icons/fa";
import { GrStatusGood, GrStatusCritical } from "react-icons/gr";
import { PiHandDepositBold } from "react-icons/pi";
import { BsFillPeopleFill } from "react-icons/bs";
import TabbedCard from "../../components/TabbedCard";
import { Vote } from "../../interfaces/models/votes.interface";
import { getVotesByProposal } from "../../api/dataApi";
import ReactPaginate from "react-paginate";
import sleep from "../../utils/sleep";
import { Validator } from "../../interfaces/models/validators.interface";
import styles from './SingleProposalPage.module.scss';
import Selector from "../../components/Selector/Selector";
import { VoteOption } from "../../interfaces/models/proposals.interface";
import VoteRow from "../../components/VoteRow/VoteRow";
import { weiFormatNice } from "../../utils/coin";

const SingleProposalPage: FC = () => {
    const { chain: chainLookupId, proposalId } = useParams();
    const { getChain, getValidators, fetchValidators } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleProposalPageResponse>(getSingleProposalPage(chain.chainId, proposalId));
    const [parsedContent, setParsedContent] = useState<([string, string | ReactNode][]) | undefined>(undefined);
    
    // Vote states for validators tab
    const [validatorVotes, setValidatorVotes] = useState<Vote[]>([]);
    const [validatorVotesPage, setValidatorVotesPage] = useState(1);
    const [validatorVotesTotal, setValidatorVotesTotal] = useState(0);
    const [loadingValidatorVotes, setLoadingValidatorVotes] = useState(true);
    
    // Vote states for accounts tab
    const [accountVotes, setAccountVotes] = useState<Vote[]>([]);
    const [accountVotesPage, setAccountVotesPage] = useState(1);
    const [accountVotesTotal, setAccountVotesTotal] = useState(0);
    const [loadingAccountVotes, setLoadingAccountVotes] = useState(true);

    // New state variable for vote filter
    const [voteFilterOption, setVoteFilterOption] = useState<string>("All");

    // Validators list from config
    const validators = getValidators(chain?.chainId);

    useEffect(() => {
        const fetchParsedContent = async () => {
            if (!data) return;
            const content = await parseProposal(chain, data.proposal.proposal);
            setParsedContent(content);
        };
        fetchParsedContent();
    }, [data, chain]);

    // Fetch validators if they're not already loaded
    useEffect(() => {
        if (chain?.chainId && !validators) {
            fetchValidators(chain.chainId);
        }
    }, [chain, validators, fetchValidators]);

    // Fetch validator votes
    useEffect(() => {
        const fetchValidatorVotes = async () => {
            if (!chain?.chainId || !proposalId) return;
            
            try {
                setLoadingValidatorVotes(true);
                const result = await getVotesByProposal(
                    chain.chainId,
                    proposalId,
                    100, // Limit to 100 validators per page
                    validatorVotesPage,
                    true // Set validator flag to true
                );
                setValidatorVotes(result.votes);
                setValidatorVotesTotal(result.total);
            } catch (error) {
                console.error("Error fetching validator votes:", error);
            } finally {
                setLoadingValidatorVotes(false);
            }
        };

        fetchValidatorVotes();
    }, [chain, proposalId, validatorVotesPage]);

    // Fetch account votes with filter
    useEffect(() => {
        const fetchAccountVotes = async () => {
            if (!chain?.chainId || !proposalId) return;
            
            try {
                setLoadingAccountVotes(true);
                // Convert filter option to API format
                let voteOptionFilter: VoteOption | undefined = undefined;
                if (voteFilterOption !== "All") {
                    if (voteFilterOption === "Veto") {
                        voteOptionFilter = "VOTE_OPTION_NO_WITH_VETO " as VoteOption; // Note the space at the end
                    } else {
                        voteOptionFilter = `VOTE_OPTION_${voteFilterOption.toUpperCase()}` as VoteOption;
                    }
                }
                
                const result = await getVotesByProposal(
                    chain.chainId,
                    proposalId,
                    30, // Default limit of 30 accounts per page
                    accountVotesPage,
                    false, // Set validator flag to false for regular accounts
                    voteOptionFilter // Pass the filter option
                );
                setAccountVotes(result.votes);
                setAccountVotesTotal(result.total);
            } catch (error) {
                console.error("Error fetching account votes:", error);
            } finally {
                setLoadingAccountVotes(false);
            }
        };

        fetchAccountVotes();
    }, [chain, proposalId, accountVotesPage, voteFilterOption]);

    const changeValidatorVotesPage = async (oldPage: number, newPage: number) => {
        try {
            setValidatorVotesPage(newPage);
            setLoadingValidatorVotes(true);
            await sleep(500); // Small delay for UI feedback
            const result = await getVotesByProposal(
                chain.chainId,
                proposalId,
                100,
                newPage,
                true
            );
            setValidatorVotes(result.votes);
        } catch (err) {
            console.error(`Error loading validator votes page ${newPage}:`, err);
            setValidatorVotesPage(oldPage);
        } finally {
            setLoadingValidatorVotes(false);
        }
    };

    // Handle filter change and reset pagination
    const handleFilterChange = (option: string) => {
        setVoteFilterOption(option);
        setAccountVotesPage(1); // Reset to first page when filter changes
    };

    // Restore the changeAccountVotesPage function
    const changeAccountVotesPage = async (oldPage: number, newPage: number) => {
        try {
            setAccountVotesPage(newPage);
            setLoadingAccountVotes(true);
            await sleep(500); // Small delay for UI feedback

            // Convert filter option to API format
            let voteOptionFilter: VoteOption | undefined = undefined;
            if (voteFilterOption !== "All") {
                if (voteFilterOption === "Veto") {
                    voteOptionFilter = "VOTE_OPTION_NO_WITH_VETO " as VoteOption; // Note the space at the end
                } else {
                    voteOptionFilter = `VOTE_OPTION_${voteFilterOption.toUpperCase()}` as VoteOption;
                }
            }

            const result = await getVotesByProposal(
                chain.chainId,
                proposalId,
                30,
                newPage,
                false,
                voteOptionFilter // Pass the filter option
            );
            setAccountVotes(result.votes);
        } catch (err) {
            console.error(`Error loading account votes page ${newPage}:`, err);
            setAccountVotesPage(oldPage);
        } finally {
            setLoadingAccountVotes(false);
        }
    };

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={`Proposal ${proposalId}`} error={error} />
    }

    const proposerDetails = data.proposingValidator?.descriptions.length ? data.proposingValidator.descriptions[0] : undefined;
    const totalNo = Number(data.proposal.tally.no) + Number(data.proposal.tally.no_with_veto);
    const totalYesNo = totalNo + Number(data.proposal.tally.yes);
    const totalWithAbstain = totalYesNo + Number(data.proposal.tally.abstain)
    const percentYes = Number(data.proposal.tally.yes) / totalYesNo;
    const turnoutDisplay = (()=>{
        if (data.proposal.totalBondedAtEnd) {
            const turnoutPercent = totalWithAbstain / Number(data.proposal.totalBondedAtEnd);
            return `${(turnoutPercent * 100).toFixed(2)}%`
        }
        const totalTally = BigInt(data.proposal.tally.yes) + BigInt(data.proposal.tally.abstain) + BigInt(data.proposal.tally.no) + BigInt(data.proposal.tally.no_with_veto);
        return `${weiFormatNice(totalTally, chain.bondingDecimals)} ${chain.bondingDisplayDenom}`
    })()

    let proposalType = data.proposal.proposalType;
    if (proposalType.includes('MsgExecLegacyContent')) proposalType = (data.proposal.proposal as v1LcdProposal).messages?.[0]?.content?.['@type'] || proposalType;

    const statusIcon =
        data.proposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? <PiHandDepositBold />
        : data.proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD' ? <FaVoteYea />
        : data.proposal.status === 'PROPOSAL_STATUS_PASSED' ? <GrStatusGood />
        : data.proposal.status === 'PROPOSAL_STATUS_FAILED'
        || data.proposal.status === 'PROPOSAL_STATUS_REJECTED' ? <GrStatusCritical />
        : <></>

    // Calculate validator pages
    const validatorVotesTotalPages = Math.ceil(validatorVotesTotal / 100);
    // Calculate account votes pages
    const accountVotesTotalPages = Math.ceil(accountVotesTotal / 30);

    // Filter active validators
    const activeValidators = validators?.filter(val => val.status === 'BOND_STATUS_BONDED') || [];
    // Map of validator account addresses to validator objects for quick lookup
    const validatorMap = validators?.reduce((acc, val) => {
        acc[val.accountAddress] = val;
        return acc;
    }, {} as Record<string, Validator>) || {};

    // Map of voter addresses to votes for validator lookup
    const voterVoteMap = validatorVotes.reduce((acc, vote) => {
        acc[vote.voter] = vote;
        return acc;
    }, {} as Record<string, Vote>);

    // Get inactive validators that have voted
    const inactiveValidatorVotes = validatorVotes.filter(vote => 
        validatorMap[vote.voter] && validatorMap[vote.voter].status !== 'BOND_STATUS_BONDED'
    );

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={`Proposal ${proposalId}`} />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><FaRegClock /><h5>Submitted</h5></div>
                    {new Date(data.proposal.submitTime).toLocaleString()}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'>{statusIcon}<h5>Status</h5></div>
                    {formatProposalStatus(data.proposal.status)}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><BsFillPeopleFill /><h5>Turout</h5></div>
                    {turnoutDisplay}
                </Card>
            </div>
            <Card>
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Type</div>
                        <div className='col'>{formatProposalType(proposalType)}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Title</div>
                        <div className='col'>{data.proposal.title}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Summary</div>
                        <p className='col' style={{whiteSpace: 'pre-wrap'}}>{data.proposal.summary}</p>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Submit Time</div>
                        <div className='col'>{new Date(data.proposal.submitTime).toLocaleString()}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Deposit End Time</div>
                        <div className='col'>
                            {new Date(data.proposal.depositEndTime).toLocaleString()}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Voting Start Time</div>
                        <div className='col'>
                            {new Date(data.proposal.votingStartTime).toLocaleString()}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Voting End Time</div>
                        <div className='col'>
                            {new Date(data.proposal.votingEndTime).toLocaleString()}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Proposer</div>
                        <div className='col d-flex gap-2 align-items-center'>
                            { data.proposingValidator ?
                                <Link to={`/${chainLookupId}/validators/${data.proposingValidator.operatorAddress}`} className='d-flex gap-2 align-items-center'>
                                    <ValidatorAvatar avatarUrl={proposerDetails?.keybaseAvatarUrl} moniker={proposerDetails?.moniker} operatorAddress={data.proposingValidator?.operatorAddress} />
                                    {proposerDetails?.moniker || data.proposingValidator?.operatorAddress}
                                </Link>
                            : data.proposal.proposer ?
                                <Link to={`/${chainLookupId}/accounts/${data.proposal.proposer}`}>{data.proposal.proposer}</Link>
                            : 'Unknown' }
                        </div>
                    </div>
                    { parsedContent === undefined ? (
                        <div className="d-flex justify-content-center">
                            <Spinner />
                        </div>
                    ) : parsedContent.map(([name, value]) => {
                        return (
                            <div className='d-flex'>
                                <div className='col-3 font-weight-bold'>{name}</div>
                                <div className='col'>
                                    {value}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3'>
                    <h5>Yes</h5>
                    {((parseInt(data.proposal.tally.yes) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>No</h5>
                    {((parseInt(data.proposal.tally.no) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Veto</h5>
                    {((parseInt(data.proposal.tally.no_with_veto) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Abstain</h5>
                    {((parseInt(data.proposal.tally.abstain) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
            </div>
            
            <TabbedCard
                title="Votes"
                tabs={[
                    {
                        title: "Validators",
                        content: (
                            <div className="position-relative">
                                {/* Header */}
                                <div className='d-flex mt-3 mb-1'>
                                    <div className='col col-1 text-center'>Rank</div>
                                    <div className='col col-6 col-md-5'>Validator</div>
                                    <div className='col col-2 col-md-3 text-center'>Vote</div>
                                    <div className='col col-3 text-end'>
                                        <span className='me-4'>Time</span>
                                    </div>
                                </div>
                                <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                                
                                {/* Active validators rows */}
                                {activeValidators.map((validator, index) => {
                                    const vote = voterVoteMap[validator.accountAddress];
                                    return (
                                        <div key={validator.operatorAddress}>
                                            <Link
                                                to={`/${chainLookupId}/validators/${validator.operatorAddress}`}
                                                className={`d-flex py-2 align-items-center ${styles.voteRow}`}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <div className='col col-1 text-center'>{index + 1}</div>
                                                <div className='col col-6 col-md-5 d-flex align-items-center gap-2'>
                                                    <ValidatorAvatar 
                                                        avatarUrl={validator.descriptions[0]?.keybaseAvatarUrl} 
                                                        moniker={validator.descriptions[0]?.moniker} 
                                                        operatorAddress={validator.operatorAddress} 
                                                    />
                                                    <span className="text-truncate">
                                                        {validator.descriptions[0]?.moniker || validator.operatorAddress}
                                                    </span>
                                                </div>
                                                <div className='col col-2 col-md-3 text-center'>
                                                    {vote ? formatVoteOption(vote.option) : '-'}
                                                </div>
                                                <div className='col col-3 text-end'>
                                                    { vote ?
                                                    <>
                                                        <div>{new Date(vote.timestamp).toLocaleString()}</div>
                                                        <div style={{fontSize: '14px', color: 'var(--secondary-text-color)'}}>{formatTime(vote.timestamp)}</div>
                                                    </>
                                                    :
                                                        '-'
                                                    }
                                                </div>
                                            </Link>
                                            <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                                        </div>
                                    );
                                })}
                                
                                {/* Inactive validators that voted */}
                                {inactiveValidatorVotes.map(vote => {
                                    const validator = validatorMap[vote.voter];
                                    if (!validator) return null;
                                    
                                    return (
                                        <div key={validator.operatorAddress}>
                                            <Link
                                                to={`/${chainLookupId}/validators/${validator.operatorAddress}`}
                                                className={`d-flex py-2 align-items-center ${styles.voteRow}`}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <div className='col col-1 text-center'>-</div>
                                                <div className='col col-6 col-md-5 d-flex align-items-center gap-2'>
                                                    <ValidatorAvatar 
                                                        avatarUrl={validator.descriptions[0]?.keybaseAvatarUrl} 
                                                        moniker={validator.descriptions[0]?.moniker} 
                                                        operatorAddress={validator.operatorAddress} 
                                                    />
                                                    <span className="text-truncate">
                                                        {validator.descriptions[0]?.moniker || validator.operatorAddress}
                                                    </span>
                                                </div>
                                                <div className='col col-2 col-md-3 text-center'>
                                                    {formatVoteOption(vote.option)}
                                                </div>
                                                <div className='col col-3 text-end'>
                                                    <div>{new Date(vote.timestamp).toLocaleString()}</div>
                                                    <div style={{fontSize: '14px', color: 'var(--secondary-text-color)'}}>{formatTime(vote.timestamp)}</div>
                                                </div>
                                            </Link>
                                            <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                                        </div>
                                    );
                                })}
                                
                                {/* Pagination */}
                                {(validatorVotesTotal > 0 && validatorVotesTotal > 100) && (
                                    <ReactPaginate
                                        breakLabel="..."
                                        nextLabel=">"
                                        onPageChange={e => changeValidatorVotesPage(validatorVotesPage, e.selected + 1)}
                                        pageRangeDisplayed={2}
                                        pageCount={validatorVotesTotalPages}
                                        previousLabel="<"
                                        renderOnZeroPageCount={null}
                                        className="react-paginate"
                                    />
                                )}
                                
                                {/* Empty state */}
                                {validatorVotesTotal === 0 && !loadingValidatorVotes && (
                                    <div className='py-4 w-full text-center'>
                                        No validator votes found.
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        title: "Accounts",
                        content: (
                            <div className="position-relative">
                                <div className='d-flex justify-content-end align-items-center'>
                                    <Selector
                                        options={["All", "Yes", "No", "Veto", "Abstain"]}
                                        selected={voteFilterOption}
                                        onSelect={handleFilterChange}
                                        height={32}
                                        borderThickness={1}
                                        style={{
                                            maxWidth: '100%',
                                            overflow: 'scroll',
                                        }}
                                        className='hideScrollbar'
                                    />
                                </div>
                                <div className='d-flex mt-3 mb-1'>
                                    <div className='col col-6'>Account</div>
                                    <div className='col col-3 text-center'>Vote</div>
                                    <div className='col col-3 text-end'>Time</div>
                                </div>
                                <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                                
                                {/* Account vote rows */}
                                {accountVotes.map(vote => (
                                    <div key={vote.voter}>
                                        <VoteRow vote={vote} />
                                        <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                                    </div>
                                ))}
                                
                                {/* Pagination */}
                                {(accountVotesTotal > 0 && accountVotesTotal > 30) && (
                                    <ReactPaginate
                                        breakLabel="..."
                                        nextLabel=">"
                                        onPageChange={e => changeAccountVotesPage(accountVotesPage, e.selected + 1)}
                                        pageRangeDisplayed={2}
                                        pageCount={accountVotesTotalPages}
                                        previousLabel="<"
                                        renderOnZeroPageCount={null}
                                        className="react-paginate"
                                    />
                                )}
                                
                                {/* Empty state */}
                                {accountVotesTotal === 0 && !loadingAccountVotes && (
                                    <div className='py-4 w-full text-center'>
                                        No account votes found.
                                    </div>
                                )}
                            </div>
                        )
                    }
                ]}
                overlay={ loadingAccountVotes || loadingValidatorVotes ?
                    <div className={styles.loadingOverlay}>
                        <Spinner />
                    </div>
                :
                    undefined
                }
            />
        </div>
    )
}

export default SingleProposalPage;

const parseProposal = async (config: FrontendChainConfig, proposal: v1beta1LcdProposal | v1LcdProposal): Promise<[string, string | ReactNode][]> => {
    let content: any = undefined;
    if (config.govVersion === 'v1beta1') {
        content = (proposal as v1beta1LcdProposal).content;
    } else if (config.govVersion === 'v1') {
        // TODO Proposals can have multiple messages as of Cosmos SDK v0.50
        const messages = (proposal as v1LcdProposal).messages;
        if (!messages.length) return [];
        if (messages[0].content) content = messages[0].content;
        else content = messages[0];
        
    } else return [];

    if (!content) return [];

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

        default: {
            console.log(`Unknown Proposal Type ${content['@type']}:`, content);
            return []
        }
    }

}