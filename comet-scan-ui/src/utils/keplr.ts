import { SecretNetworkClient, EncryptionUtils } from 'secretjs';
import sleep from './sleep.ts';
import { FrontendChainConfig } from '@comet-scan/types';

export const connectKeplrWallet = async(chainConfig: FrontendChainConfig): Promise<{
    client: SecretNetworkClient;
    address: string;
    keyName: string;
    encryptionUtils: EncryptionUtils;
}> => {
  console.log('Connecting Keplr Wallet!!')
  if (!window.keplr) {
    sleep(1_500)
  }
  if (!window.keplr) {
    throw new Error('Keplr Wallet not found')
  }

  await window.keplr.enable(chainConfig.chainId);

  const {name: keyName} = await window.keplr.getKey(chainConfig.chainId)
    
  const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(chainConfig.chainId);
  const accounts = await offlineSigner.getAccounts();
  const address = accounts[0].address;
  const encryptionUtils = window.keplr.getEnigmaUtils(chainConfig.chainId);

  const client = new SecretNetworkClient({
    url: chainConfig.lcd,
    chainId: chainConfig.chainId,
    walletAddress: address,
    wallet: offlineSigner,
    encryptionUtils
  });
  console.log('Wallet Connected:', accounts[0].address)
  return {client, address: accounts[0].address, keyName, encryptionUtils}
}