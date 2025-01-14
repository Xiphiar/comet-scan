import { createContext } from "react";
import { FrontendChainConfig } from "../interfaces/config.interface";
  
export interface ConfigContextState {
    chains: FrontendChainConfig[];
    getChain: (chainLookupId: string) => FrontendChainConfig | undefined;
    refreshConfig: () => Promise<void>;

    devMode: boolean;
    toggleDevMode: () => void;

    themeClass: string;
    setThemeClass: (value: string) => void;
}
  
// created context with no default values
const ConfigContext = createContext<ConfigContextState>({
    chains: [],
    getChain: () => {throw 'Context not ready'},
    refreshConfig: async () => {},

    devMode: false,
    toggleDevMode: () => {},

    themeClass: 'theme-light',
    setThemeClass: () => {},
});

export default ConfigContext;