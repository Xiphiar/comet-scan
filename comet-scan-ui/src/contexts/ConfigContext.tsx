import { createContext } from "react";
import { FrontendChainConfig, Validator } from "@comet-scan/types";
  
export interface ConfigContextState {
    chains: FrontendChainConfig[];
    getChain: (chainLookupId: string) => FrontendChainConfig | undefined;
    refreshConfig: () => Promise<void>;

    devMode: boolean;
    toggleDevMode: () => void;

    themeClass: string;
    setThemeClass: (value: string) => void;

    validators: Record<string, Validator[]>;
    getValidators: (chainId: string) => Validator[] | undefined;
    fetchValidators: (chainId: string) => Promise<void>;
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

    validators: {},
    getValidators: () => { throw 'Context not ready'},
    fetchValidators: async () => { throw 'Context not ready'},
});

export default ConfigContext;