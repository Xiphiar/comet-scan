import { useContext } from "react";
import ConfigContext, { ConfigContextState } from "../contexts/ConfigContext";

const useConfig = (): ConfigContextState => useContext(ConfigContext);

export default useConfig;