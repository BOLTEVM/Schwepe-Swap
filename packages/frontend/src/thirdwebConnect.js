// Thirdweb SDK v5 Connect Module for SchwepeSwap
import { createThirdwebClient, defineChain, getContract, readContract, prepareContractCall } from 'thirdweb';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { SOMNIA_CHAINS } from '../../sdk/src/constants.ts';

export class SchwepeThirdwebConnect {
  constructor(clientId) {
    this.client = createThirdwebClient({
      clientId: clientId || 'demo-client-id-somnia'
    });

    this.somniaMainnet = defineChain({
      id: SOMNIA_CHAINS.MAINNET.chainId,
      name: SOMNIA_CHAINS.MAINNET.name,
      nativeCurrency: SOMNIA_CHAINS.MAINNET.nativeCurrency,
      rpc: SOMNIA_CHAINS.MAINNET.rpc
    });

    this.somniaTestnet = defineChain({
      id: SOMNIA_CHAINS.TESTNET.chainId,
      name: SOMNIA_CHAINS.TESTNET.name,
      nativeCurrency: SOMNIA_CHAINS.TESTNET.nativeCurrency,
      rpc: SOMNIA_CHAINS.TESTNET.rpc
    });

    this.activeWallet = null;
    this.activeAccount = null;
  }

  // 1. Connect MetaMask / Injected EIP-1193 Wallet via Thirdweb v5
  public async connectMetaMask() {
    const wallet = createWallet('io.metamask');
    const account = await wallet.connect({
      client: this.client,
      chain: this.somniaMainnet
    });
    this.activeWallet = wallet;
    this.activeAccount = account;
    return { wallet, account, address: account.address };
  }

  // 2. Connect Coinbase Wallet via Thirdweb v5
  public async connectCoinbase() {
    const wallet = createWallet('com.coinbase.wallet');
    const account = await wallet.connect({
      client: this.client,
      chain: this.somniaMainnet
    });
    this.activeWallet = wallet;
    this.activeAccount = account;
    return { wallet, account, address: account.address };
  }

  // 3. Connect InApp / Social / Email Wallet via Thirdweb v5
  public async connectInApp(email) {
    const wallet = inAppWallet();
    const account = await wallet.connect({
      client: this.client,
      chain: this.somniaMainnet,
      strategy: 'email',
      email
    });
    this.activeWallet = wallet;
    this.activeAccount = account;
    return { wallet, account, address: account.address };
  }

  // 4. Switch Active Chain to Somnia Mainnet (5031) or Testnet (50312)
  public async switchSomniaChain(chainId = 5031) {
    if (!this.activeWallet) throw new Error('No active wallet connected');
    const targetChain = chainId === 5031 ? this.somniaMainnet : this.somniaTestnet;
    await this.activeWallet.switchChain(targetChain);
    return targetChain;
  }

  // 5. Read Native SOMI Balance
  public async getNativeBalance(address, chainId = 5031) {
    const rpcUrl = chainId === 5031 ? SOMNIA_CHAINS.MAINNET.rpc : SOMNIA_CHAINS.TESTNET.rpc;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    });
    const json = await response.json();
    if (json.result) {
      return (parseInt(json.result, 16) / 1e18).toFixed(4);
    }
    return '0.0000';
  }

  // 6. Disconnect Active Wallet
  public async disconnect() {
    if (this.activeWallet) {
      await this.activeWallet.disconnect();
      this.activeWallet = null;
      this.activeAccount = null;
    }
  }
}
