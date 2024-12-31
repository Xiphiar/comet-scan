import { useEffect, useState } from "react"

type Returns<T> = {
    data?: T;
    refresh: ()=>void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
}

type Config = {
    updateOn?: unknown[];
}

const useAsync = <T>(promise: Promise<T>, config?: Config): Returns<T> => {
    const [result, setResult] = useState<T>();
    const [error, setError] = useState<unknown>();

    useEffect(()=>{
        refresh();
    }, config?.updateOn || [])

    const refresh = async () => {
        try {
            setResult(undefined);
            const data = await promise;
            setResult(data);
        } catch (e: unknown) {
            console.error('Async error:', e.toString());
            setError(e);
        }
    }

    return {
        data: result,
        refresh,
        error,
    };
}

export default useAsync;