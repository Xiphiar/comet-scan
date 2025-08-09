import { PropsWithChildren, ReactElement, useEffect, useState } from "react";
import { getConfig, getChainValidators } from "../api/configApi";
import ConfigContext, { ConfigContextState } from "../contexts/ConfigContext";
import { FrontendChainConfig, Validator } from "@comet-scan/types";
import MainPage from "../pages/Main/MainPage";
import { setTheme } from "../utils/theme";

const ConfigProvider = ({ children }: PropsWithChildren): ReactElement => {
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState<string>();
    const [chains, setChains] = useState<FrontendChainConfig[]>([]);
    const [devMode, setDevMode] = useState(false);
    const [validators, setValidators] = useState<Record<string, Validator[]>>({});

    const defaultTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );
    const [themeClass, setThemeClass] = useState(defaultTheme ? defaultTheme : prefersDark.matches ? 'theme-dark' : 'theme-light');

    useEffect(() => {
        setTheme(themeClass)
    }, [themeClass])

    const toggleDevMode = () => setDevMode(!devMode)

    const getChain = (chainLookupId: string): FrontendChainConfig | undefined => {
        const chain = chains.find(c => c.id.toLowerCase() === chainLookupId.toLowerCase());
        return chain;
    }

    const fetchValidators = async (chainId: string): Promise<void> => {
        // Don't fetch if we already have them
        if (validators[chainId]) {
            return;
        }

        console.log(`Fetching validators for ${chainId}`);
        try {
            const data = await getChainValidators(chainId);
            setValidators(prev => ({
                ...prev,
                [chainId]: data.validators,
            }));
        } catch (err: unknown) {
            console.error(`Failed to fetch validators for chain ${chainId}:`, err.toString?.() || err);
        }
    };

    const getValidators = (chainId: string): Validator[] | undefined => {
        return validators[chainId];
    }

    const refreshConfig = async () => {
        try {
            const config = await getConfig();
            setChains(config.chains);
        } catch(err: unknown) {
            console.error('Failed to refresh chain config:', err.toString?.() || err);
            setLoadingError(err.toString())
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        refreshConfig();
    }, [])
  
    const values: ConfigContextState = {
        chains,
        getChain,
        refreshConfig,
        validators,
        getValidators,
        fetchValidators,

        devMode,
        toggleDevMode,

        themeClass,
        setThemeClass,
    };
  
    return (
        <ConfigContext.Provider value={values}>
            { (loading || loadingError) ?
                <MainPage isLoading={loading} loadingError={loadingError} />
            :
                children
            }
        </ConfigContext.Provider>
    );
};

export default ConfigProvider;