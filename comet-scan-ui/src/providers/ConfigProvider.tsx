import { PropsWithChildren, ReactElement, useEffect, useState } from "react";
import { getConfig } from "../api/configApi";
import ConfigContext, { ConfigContextState } from "../contexts/ConfigContext";
import { FrontendChainConfig } from "../interfaces/config.interface";
import MainPage from "../pages/Main/MainPage";
import { setTheme } from "../utils/theme";

const ConfigProvider = ({ children }: PropsWithChildren): ReactElement => {
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState<string>();
    const [chains, setChains] = useState<FrontendChainConfig[]>([]);
    const [devMode, setDevMode] = useState(false);
    const [themeClass, setThemeClass] = useState("theme-light");

    useEffect(() => {
        setTheme(themeClass)
    }, [themeClass])

    const toggleDevMode = () => setDevMode(!devMode)

    const getChain = (chainLookupId: string): FrontendChainConfig | undefined => {
        const chain = chains.find(c => c.id.toLowerCase() === chainLookupId.toLowerCase());
        // if (!chain) throw `Chain ${chainLookupId} not found`;
        return chain;
    }

    const refreshConfig = async () => {
        try {
            const config = await getConfig();
            console.log(config);
            setChains(config.chains);
        } catch(err: unknown) {
            console.error('Failed to refresh chain config:', err.toString?.() || err);
            // TODO show popup or error
            // throw err;
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