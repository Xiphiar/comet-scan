import { useEffect, useState } from "react"

type Returns<T> = {
    data?: T;
    refresh: ()=>void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
}

type Config = {
    updateOn?: unknown[];
    disabled?: boolean;
}

const useAsync = <T>(promise: Promise<T>, config?: Config): Returns<T> => {
    const [result, setResult] = useState<T>();
    const [error, setError] = useState<unknown>();

    const updateOn = [...(config?.updateOn || []), config?.disabled];

    useEffect(()=>{
        refresh();
    }, updateOn)

    const refresh = async () => {
        if (config?.disabled) return;

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