import { createThirdwebClient, defineChain, getContract, readContract, prepareContractCall } from 'thirdweb';
import { SOMNIA_CHAINS } from './constants.ts';

export class SchwepeThirdwebClient {
  private client: ReturnType<typeof createThirdwebClient>;

  constructor(clientId?: string) {
    this.client = createThirdwebClient({
      clientId: clientId || process.env.THIRDWEB_CLIENT_ID || 'demo-client-id-somnia'
    });
  }

  public getClient() {
    return this.client;
  }

  public getSomniaChain(chainId: number = 5031) {
    const isMainnet = chainId === SOMNIA_CHAINS.MAINNET.chainId;
    const config = isMainnet ? SOMNIA_CHAINS.MAINNET : SOMNIA_CHAINS.TESTNET;
    
    return defineChain({
      id: config.chainId,
      name: config.name,
      nativeCurrency: config.nativeCurrency,
      rpc: config.rpc
    });
  }

  public getContractInstance(address: string, chainId: number = 5031, abi?: any) {
    const chain = this.getSomniaChain(chainId);
    return getContract({
      client: this.client,
      chain,
      address,
      abi
    });
  }

  public async readContractState(address: string, method: string, params: any[] = [], chainId: number = 5031, abi?: any) {
    const contract = this.getContractInstance(address, chainId, abi);
    return await readContract({
      contract,
      method,
      params
    });
  }

  public prepareTransaction(address: string, method: string, params: any[] = [], value?: bigint, chainId: number = 5031, abi?: any) {
    const contract = this.getContractInstance(address, chainId, abi);
    return prepareContractCall({
      contract,
      method,
      params,
      value
    });
  }
}
