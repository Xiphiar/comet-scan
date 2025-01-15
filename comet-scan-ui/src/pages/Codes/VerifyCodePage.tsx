import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { getVerificationStatus, startSecretWasmVerification } from "../../api/verificationApi";
import { TaskStatus } from "../../interfaces/verification.interface";
import Spinner from "../../components/Spinner";
import parseError from "../../utils/parseError";

const VerifyCodePage: FC = () => {
    const { chain: chainLookupId, codeId, taskId: _taskId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);

    const [repo, setRepo] = useState('');
    const [commit, setCommit] = useState('main');
    const [taskId, setTaskId] = useState<number | undefined>(_taskId ? parseInt(_taskId) : undefined);

    const { data, error, refresh } = useAsync<TaskStatus>(getVerificationStatus(taskId));

    const title = `Verify Contract Code`;

    useEffect(()=>{
        if (taskId) {
            // TODO refresh doesn't seem to re-render?
            setInterval(refresh, 30_000);
        }
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
                <Card conentClassName='align-items-center p-4 gap-4'>
                    { (data.status === 'Running') && <>
                        <div>Verification is in progress. This process will take several minutes to complete.</div>
                        <Spinner />
                    </>}
                    { (data.status.Done?.Success) &&
                        <div>Verification task completed. Check the code page to see if the code was verified. TODO display results here.</div>
                    }
                    { (data.status.Done?.Failed) &&
                        <div>Verification failed.</div>
                    }
                    { data.status.Queued && <>
                        <div>Verification is pending.</div>
                        <Spinner />
                    </>}
                    <pre style={{width: '100%'}}>{JSON.stringify(data, undefined, 2)}</pre>
                </Card>
            </div>
        )
    }

    const handleVerify = async (e?: any) => {
        e?.preventDefault?.();
        try {
            if (!repo) throw 'Please enter a repository URL'
            if (!commit) throw 'Please enter a branch, tag, or commit hash'
            // TODO verify repo URL

            if (chain.features.includes('secretwasm')) {
                const data = await startSecretWasmVerification(chain.chainId, {
                    repo,
                    commit: commit || undefined,
                })
                setTaskId(data.task_id)
            } else {
                throw 'Only SecretWasm contracts can be verified at this time.'
            }
        } catch (err: any) {
            const p = parseError(err)
            alert(`TODO handle verify errr: ${p}`)
        }
    }
 
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} excludeNetworkName={true} />
            <Card conentClassName='p-4'>
                <h3>Verify Contract Code</h3>
                <p>
                    Enter a Git repository URL, and a tag or commit hash to start the verification process.<br />
                    <br />
                    The code will be compiled with every version of the contract optimizer. If the compiled code hash matches any contracts in our database, those contracts will be marked as verified.<br />
                    <br />
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
                    <li>Avoid changing optimizer versions for an existing commit. If this process fails to verify an existing commit with a different optimizer version, please contact us.</li>
                </ul>

                <form onSubmit={handleVerify} className='d-flex flex-column gap-3 mt-4'>
                    <label className='d-flex flex-column gap-1'>
                        Repository URL
                        <input value={repo} onChange={e => setRepo(e.target.value.trim())} className='p-2' placeholder='https://github.com/TriviumNode/example.git' />
                    </label>
                    <label className='d-flex flex-column gap-1'>
                        Tag, Branch, or Commit Hash
                        <input value={commit} onChange={e => setCommit(e.target.value.trim())} className='p-2' />
                    </label>
                    <div className='d-flex justify-content-center mt-2'>
                        <button type='submit' className='button'>Submit</button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default VerifyCodePage;