import { useCallback, useEffect, useState } from "react"

type Returns<T> = {
    data?: T;
    refresh: ()=>void;
    error: any;
}

type Config = {
    updateOn?: unknown[];
    disabled?: boolean;
}

// Refresh doesnt work on this one...
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
        refresh, // Doesn't seem to work, returned data does not change?
        error,
    };
}

// Hook from the internet, seem to work with refresh...
export function useAsyncV2<T>(callback, dependencies = [], disabled?: boolean) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>()
    const [value, setValue] = useState<T | undefined>()

    const callbackMemoized = useCallback(() => {
        if (disabled) return;
        setLoading(true)
        setError(undefined)
        setValue(undefined)
        callback()
            .then(setValue)
            .catch(setError)
            .finally(() => setLoading(false))
    }, [disabled, ...dependencies])

    useEffect(() => {
        callbackMemoized()
    }, [callbackMemoized])

    return { loading, error, data: value, refresh: callbackMemoized }
}

export default useAsync;