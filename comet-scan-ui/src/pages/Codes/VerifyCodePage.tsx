import { FC, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { getVerificationStatus, startSecretWasmVerification } from "../../api/verificationApi";
import { TaskStatus } from "../../interfaces/verification.interface";
import Spinner from "../../components/Spinner";
import parseError from "../../utils/parseError";
import { toast } from "react-fox-toast";
import SmallSpinner from "../../components/SmallSpinner/smallSpinner";

const ALREADY_VERIFIED_EXIT_CODE = 124;
const DB_ERROR_EXIT_CODE = 125;
const DOCKER_ERROR_EXIT_CODE = 126;
const NO_MATCH_EXIT_CODE = 127;
const INVALID_COMMIT_EXIT_CODE = 128;

const parseFailedStatus = (exitCode: number) => {
    if (exitCode === ALREADY_VERIFIED_EXIT_CODE) {
        return 'Contract code is already verified.';
    }
    if (exitCode === NO_MATCH_EXIT_CODE) {
        return 'Contract code does not match any contracts in our database.';
    }
    if (exitCode === DB_ERROR_EXIT_CODE || exitCode === DOCKER_ERROR_EXIT_CODE) {
        return 'Internal error. Please try again later.';
    }
    if (exitCode === INVALID_COMMIT_EXIT_CODE) {
        return 'Invalid tag, branch, or commit hash. Ensure the provided branch, tag, or commit hash is valid.';
    }
    return 'Unknown error.';
}

const optimizerVersions = [
    "1.0.10",
    "1.0.9",
    "1.0.8",
    "1.0.7",
    "1.0.6",
    "1.0.5",
    "1.0.4",
    "1.0.3",
    "1.0.2",
    "1.0.1",
];

const VerifyCodePage: FC = () => {
    const { chain: chainLookupId, taskId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const navigate = useNavigate();

    const [repo, setRepo] = useState('');
    const [commit, setCommit] = useState('main');
    const [optimizer, setOptimizer] = useState(optimizerVersions[0]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TaskStatus>();
    const [error, setError] = useState<string>();
    const intervalRef = useRef<NodeJS.Timeout>();

    const title = `Verify Contract Code`;

    const refresh = async () => {
        if (!taskId) return;
        try {
            console.log('refreshing');
            const d = await getVerificationStatus(taskId);
            setData(d);
            if (d.status.Done || d.status.Failed) {
                clearInterval(intervalRef.current);
            }
        } catch (err: any) {
            setError(parseError(err));
        }
    }

    useEffect(()=>{
        if (!taskId) return;
        intervalRef.current = setInterval(refresh, 10_000);
        refresh();
    }, [taskId])

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (taskId && !data) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    if (taskId) {
        return (
            <div className='d-flex flex-column'>
                <TitleAndSearch chain={chain} title={title} />
                <Card conentClassName='align-items-center p-4 gap-4 text-center'>
                    { (data.status === 'Running') && <>
                        <div>Verification is in progress. This process will take several minutes to complete.</div>
                        <Spinner />
                    </>}
                    { (data.status.Done === 'Success') &&
                        <>
                            <div>Verification task completed successfully!<br/>Check the contract page to see if the code was verified.</div>
                            <Link to={`/${chainLookupId}/codes/verify`} className='button'>Go Back</Link>
                            {/* TODO display a list of codes that matched this commit */}
                        </>
                    }
                    { (data.status.Done?.Failed) &&
                        <>
                            <div>{parseFailedStatus(data.status.Done?.Failed)}</div>
                            <Link to={`/${chainLookupId}/codes/verify`} className='button'>Go Back</Link>
                        </>
                    }
                    { data.status === 'Queued' && <>
                        <div>Verification is pending.</div>
                        <Spinner />
                    </>}
                    <pre style={{width: '100%'}} className='text-start'>{JSON.stringify(data, undefined, 2)}</pre>
                </Card>
            </div>
        )
    }

    const handleVerify = async (e?: any) => {
        e?.preventDefault?.();
        try {
            setLoading(true);
            if (!repo) throw 'Please enter a repository URL'
            if (!commit) throw 'Please enter a branch, tag, or commit hash'
            // TODO verify repo URL

            if (chain.features.includes('secretwasm')) {
                const data = await startSecretWasmVerification({
                    repo,
                    commit: commit || undefined,
                    optimizer,
                })
                setRepo(undefined);
                setCommit('main');
                navigate(`/${chainLookupId}/codes/verify/${data.task_id}`)
            } else {
                throw 'Only SecretWasm contracts can be verified at this time.'
            }
        } catch (err: any) {
            const p = parseError(err);
            toast.error(`Failed to start verification: ${p}`);
        } finally {
            setLoading(false);
        }
    }
 
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} excludeNetworkName={true} />
            <Card conentClassName='p-4'>
                <h3>Verify Contract Code</h3>
                <p>
                    Enter a Git repository URL, a tag or commit hash, and an select the optimizer version your contract was compiled with to start the verification process.<br />
                    <br />
                    {/* The code will be compiled with every version of the contract optimizer. If the compiled code hash matches any contracts in our database, those contracts will be marked as verified.<br />
                    <br /> */}
                    This process can take up to an hour to complete.<br />
                    <br />
                    <b>Do not attempt to verify any code that should be kept private.</b> Verified code will be made available to download by any user of Comet Scan.<br />
                    <br />
                    After submitting a repository, you will be given a URL to track the verification process.<br />
                </p>
                <div className='mt-2'>To successfully verify contract code:</div>
                <ul className='mt-1 d-flex flex-column gap-1'>
                    <li>The repository must be accessible to the public. Private repositories are not supported.</li>
                    <li>The on-chain code must be compiled with the <span className='fw-bold'>{chain.features.includes('secretwasm') ? 'secret-contract-optimizer' : 'cosmwasm-contract-optimizer'}</span> docker image.</li>
                    <li>The contract must be imported into Comet Scan's database. Ensure you can lookup your contract with the Comet Scan explorer before attempting verification.</li>
                    {/* <li>Avoid changing optimizer versions for an existing commit. If this process fails to verify an existing commit with a different optimizer version, please contact us.</li> */}
                </ul>

                <form onSubmit={handleVerify} className='d-flex flex-column gap-3 mt-4'>
                    <label className='d-flex flex-column gap-1'>
                        Repository URL
                        <input value={repo} onChange={e => setRepo(e.target.value.trim())} className='p-2' placeholder='https://github.com/TriviumNode/example.git' />
                    </label>
                    <div className='d-flex gap-3'>
                        <label className='d-flex flex-column gap-1 flex-grow-1'>
                            Tag, Branch, or Commit Hash
                            <input value={commit} onChange={e => setCommit(e.target.value.trim())} className='p-2' />
                        </label>
                        <label className='d-flex flex-column gap-1'>
                            Optimizer Version
                            <select value={optimizer} onChange={e => setOptimizer(e.target.value)} className='p-2'>
                                {optimizerVersions.map(version => (
                                    <option key={version} value={version}>{version}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className='d-flex justify-content-center mt-2'>
                        <button type='submit' className='button' disabled={loading}>
                            Submit
                            { loading && <>&nbsp;<SmallSpinner /></> }
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default VerifyCodePage;