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

    const title = `Verify Code ${codeId}`;

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
            <div className='d-flex flex-column mx-4'>
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
            if (chain.features.includes('secretwasm')) {
                const data = await startSecretWasmVerification(chain.chainId, {
                    repo,
                    commit: commit || undefined,
                    codeId
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
        <div className='d-flex flex-column mx-4'>
            <TitleAndSearch chain={chain} title={title} />
            <Card conentClassName='p-4'>
                <div className='text-center'>
                    Enter a repo URL and commit or tag to start the verification process. This process will take up to an hour to complete.
                </div>
                <div className='text-center'>
                    <span className='fw-bold'>Note:</span> The contract code must be compiled with the <span className='fw-bold'>{chain.features.includes('secretwasm') ? 'secret-contract-optimizer' : 'cosmwasm-contract-optimizer'}</span> docker image for the code to be verified.
                </div>

                <form onSubmit={handleVerify} className='d-flex flex-column gap-2 mt-4'>
                    <label className='d-flex flex-column gap-1'>
                        Repo URL
                        <input value={repo} onChange={e => setRepo(e.target.value.trim())} className='p-2' />
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