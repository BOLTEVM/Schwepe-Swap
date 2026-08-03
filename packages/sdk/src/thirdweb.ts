import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { SOMNIA_CHAINS } from './constants.ts';

export class SchwepeThirdwebClient {
  private sdkMainnet: ThirdwebSDK;
  private sdkTestnet: ThirdwebSDK;

  constructor(clientId?: string) {
    const options = clientId ? { clientId } : {};
    this.sdkMainnet = new ThirdwebSDK(SOMNIA_CHAINS.MAINNET.rpc, options);
    this.sdkTestnet = new ThirdwebSDK(SOMNIA_CHAINS.TESTNET.rpc, options);
  }

  public getSDK(chainId: number): ThirdwebSDK {
    if (chainId === SOMNIA_CHAINS.MAINNET.chainId) {
      return this.sdkMainnet;
    } else if (chainId === SOMNIA_CHAINS.TESTNET.chainId) {
      return this.sdkTestnet;
    }
    throw new Error(`Unsupported Somnia Chain ID: ${chainId}`);
  }

  public async getContract(address: string, chainId: number = SOMNIA_CHAINS.MAINNET.chainId) {
    const sdk = this.getSDK(chainId);
    return await sdk.getContract(address);
  }

  public async getBalance(walletAddress: string, tokenAddress?: string, chainId: number = SOMNIA_CHAINS.MAINNET.chainId) {
    const sdk = this.getSDK(chainId);
    if (!tokenAddress || tokenAddress.toLowerCase() === SOMNIA_CHAINS.MAINNET.nativeCurrency.symbol.toLowerCase()) {
      return await sdk.getBalance(walletAddress);
    }
    const contract = await sdk.getContract(tokenAddress, 'token');
    return await contract.balanceOf(walletAddress);
  }
}
