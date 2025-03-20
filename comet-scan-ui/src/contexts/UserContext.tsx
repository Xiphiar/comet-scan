import {
    createContext,
    useState,
    ReactElement,
    ReactNode} from 'react';
  import { connectKeplrWallet } from '../utils/keplr';
  import { toast } from 'react-fox-toast';
  
  import { SecretNetworkClient, EncryptionUtils } from 'secretjs';
import { FrontendChainConfig } from '../interfaces/config.interface';
  
  interface Props {
    children: ReactNode;
  }
  
  export interface CurrentWallet {
    wallet_type: 'Keplr';
    key_name: string;
    client:  SecretNetworkClient;
    address: string;
    encryptionUtils: EncryptionUtils;
  }
  
  export interface UserContextState {
    user: CurrentWallet | undefined;
    connectWallet: ((chainConfig: FrontendChainConfig)=>Promise<void>);
    isLoading: boolean;
  }
  
  const whatever = async() => {}
  
  // created context with no default values
  const UserContext = createContext<UserContextState>({
    user: undefined,
    connectWallet: whatever,
    isLoading: false,
  });
  
  export const UserProvider = ({ children }: Props): ReactElement => {
    const [user, setUser] = useState<CurrentWallet>();
    const [isLoading, setIsLoading] = useState(false);
  
    window.addEventListener('keplr_keystorechange', () => {
      console.log('Keplr wallet changed!');
      onChangeWallet();
    })
  
    window.addEventListener('leap_keystorechange', () => {
      console.log('Leap wallet changed!');
      onChangeWallet();
    })
  
    window.addEventListener('cosmostation_keystorechange', () => {
      console.log('Cosmostation wallet changed!');
      onChangeWallet();
    })
  
    const onChangeWallet = async () => {
      setUser(undefined);
      // if (!user) {
      //   // connectWallet()
      //   return;
      // }
      // if (!window.keplr) throw new Error('window.keplr is not defined.')
  
      // const keyResult = await window.keplr.getKey(import.meta.env.VITE_CHAIN_ID)
      // console.log('New Address', keyResult.bech32Address)
      // console.log('Current Address', user.address);
  
      // if (keyResult.bech32Address === user.address) {
      //   // Hide modal if switching back to previous wallet
      //   setWalletStatus('CONNECTED')
      // } else {
      //   // Display modal
      //   setWalletStatus('SWITCH')
      // }
    }
  
    const connectWallet = async (chainConfig: FrontendChainConfig) => {
      try {
        setIsLoading(true);
        console.log('Connecting wallet')
        const { client, address, keyName, encryptionUtils } = await connectKeplrWallet(chainConfig);
        const newUser: CurrentWallet = {client, address, wallet_type: 'Keplr', key_name: keyName, encryptionUtils}
        setUser(newUser)
  
      } catch(err: any){
        console.error('Error connecting wallet: ', err)
        switch(err.message){
        case 'Keplr Wallet not found':
          toast.error('Keplr Wallet was not found. Ensure it is enabled and unlocked.')
          break;
        default:
          if (err.message.includes('NetworkError when attempting to fetch resource.'))
            toast.error('Error connecting wallet: Failed to query chain')
          else toast.error(`Error connecting wallet: ${err.message}`)
          break;
        }
      } finally {
        setIsLoading(false);
      }
    }
  
    const values: UserContextState = {
      user,
      connectWallet,
      isLoading,
    };
  
    return (
      <UserContext.Provider value={values}>
        {children}
      </UserContext.Provider>
    );
  };
  
  export default UserContext;
  