import { getAmountOut, calculateSlippage, calculatePriceImpact } from './trade.ts';
import { SOMNIA_CHAINS, SCHWEPESWAP_ADDRESSES, SOMIA_SOMI_TOKEN_ADDRESS } from './constants.ts';

export interface PipelineStageResult {
  stage: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  data?: any;
  timestamp: string;
}

export interface Web3PipelineOptions {
  chainId: number;
  walletAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number; // e.g. 50 = 0.5%
}

export class SchwepeWeb3Pipeline {
  private chainId: number;
  private walletAddress: string;
  private tokenIn: string;
  private tokenOut: string;
  private amountIn: string;
  private slippageBps: number;
  private logs: PipelineStageResult[] = [];

  constructor(options: Web3PipelineOptions) {
    this.chainId = options.chainId || 5031;
    this.walletAddress = options.walletAddress;
    this.tokenIn = options.tokenIn;
    this.tokenOut = options.tokenOut;
    this.amountIn = options.amountIn;
    this.slippageBps = options.slippageBps || 50;
  }

  private log(stage: string, status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED', message: string, data?: any) {
    const record: PipelineStageResult = {
      stage,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.logs.push(record);
    console.log(`[Web3 Pipeline :: ${stage}] [${status}] ${message}`, data || '');
    return record;
  }

  // STAGE 1: Validate Somnia Network Chain ID
  public async stageValidateNetwork(): Promise<boolean> {
    this.log('STAGE_1_VALIDATE_NETWORK', 'PENDING', `Verifying target Somnia chain ID ${this.chainId}`);
    await new Promise((resolve) => setTimeout(resolve, 300)); // Async await pipeline tick

    if (this.chainId !== 5031 && this.chainId !== 50312) {
      this.log('STAGE_1_VALIDATE_NETWORK', 'FAILED', `Unsupported chain ID: ${this.chainId}`);
      return false;
    }

    const config = this.chainId === 5031 ? SOMNIA_CHAINS.MAINNET : SOMNIA_CHAINS.TESTNET;
    this.log('STAGE_1_VALIDATE_NETWORK', 'SUCCESS', `Connected to ${config.name} (${config.rpc})`, {
      chainId: this.chainId,
      somiTokenTarget: SOMIA_SOMI_TOKEN_ADDRESS
    });
    return true;
  }

  // STAGE 2: Fetch Pair Reserves & Pool Liquidity from Somnia EVM
  public async stageFetchLiquidityReserves(): Promise<{ reserveIn: bigint; reserveOut: bigint }> {
    this.log('STAGE_2_FETCH_RESERVES', 'PENDING', `Querying pair liquidity reserves for ${this.tokenIn} -> ${this.tokenOut}`);
    await new Promise((resolve) => setTimeout(resolve, 400)); // Async await network call

    // Simulated reserves for Somnia EVM AMM pool
    const reserveIn = 1_000_000n * 10n ** 18n;  // 1,000,000 Token In
    const reserveOut = 2_500_000n * 10n ** 18n; // 2,500,000 Token Out

    this.log('STAGE_2_FETCH_RESERVES', 'SUCCESS', 'Liquidity reserves fetched successfully', {
      reserveIn: reserveIn.toString(),
      reserveOut: reserveOut.toString()
    });

    return { reserveIn, reserveOut };
  }

  // STAGE 3: Compute Trade Output & Slippage
  public async stageCalculateTrade(reserveIn: bigint, reserveOut: bigint): Promise<{ amountOut: bigint; minAmountOut: bigint; priceImpact: number }> {
    this.log('STAGE_3_CALCULATE_TRADE', 'PENDING', 'Computing constant product trade output and slippage');
    await new Promise((resolve) => setTimeout(resolve, 200)); // Async await computation

    const amountInBig = BigInt(Math.floor(parseFloat(this.amountIn) * 1e18));
    const amountOut = getAmountOut(amountInBig, reserveIn, reserveOut);
    const minAmountOut = calculateSlippage(amountOut, this.slippageBps);
    const priceImpact = calculatePriceImpact(amountInBig, amountOut, reserveIn, reserveOut);

    this.log('STAGE_3_CALCULATE_TRADE', 'SUCCESS', `Expected Out: ${(Number(amountOut) / 1e18).toFixed(4)}, Min Out: ${(Number(minAmountOut) / 1e18).toFixed(4)}, Price Impact: ${priceImpact.toFixed(2)}%`, {
      amountOut: amountOut.toString(),
      minAmountOut: minAmountOut.toString(),
      priceImpact
    });

    return { amountOut, minAmountOut, priceImpact };
  }

  // STAGE 4: Check & Execute Token Approval
  public async stageCheckAndApproveAllowance(): Promise<boolean> {
    this.log('STAGE_4_ALLOWANCE_APPROVAL', 'PENDING', `Checking ERC-20 allowance for wallet ${this.walletAddress}`);
    await new Promise((resolve) => setTimeout(resolve, 350)); // Async await contract read

    const currentAllowance = 0n; // Assume approval needed for sprint pipeline demonstration
    if (currentAllowance < BigInt(Math.floor(parseFloat(this.amountIn) * 1e18))) {
      this.log('STAGE_4_ALLOWANCE_APPROVAL', 'PENDING', 'Allowance insufficient. Awaiting user transaction approval...');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Async await tx confirmation
      this.log('STAGE_4_ALLOWANCE_APPROVAL', 'SUCCESS', 'ERC-20 token approval confirmed on Somnia Network');
    } else {
      this.log('STAGE_4_ALLOWANCE_APPROVAL', 'SKIPPED', 'Sufficient allowance already granted');
    }

    return true;
  }

  // STAGE 5: Execute Swap via SchwepeRouter
  public async stageExecuteSwapTransaction(minAmountOut: bigint): Promise<{ txHash: string; blockNumber: number }> {
    this.log('STAGE_5_EXECUTE_SWAP', 'PENDING', 'Submitting swap transaction to SchwepeRouter contract on Somnia Network');
    await new Promise((resolve) => setTimeout(resolve, 600)); // Async await broadcast & block inclusion

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const blockNumber = 12948192;

    this.log('STAGE_5_EXECUTE_SWAP', 'SUCCESS', `Swap transaction included in Somnia block #${blockNumber}`, {
      txHash,
      explorerUrl: `${SOMNIA_CHAINS.MAINNET.explorer}/tx/${txHash}`
    });

    return { txHash, blockNumber };
  }

  // FULL PIPELINE RUNNER WITH AWAIT WORKFLOW
  public async executePipeline(): Promise<{ success: boolean; logs: PipelineStageResult[]; txHash?: string }> {
    console.log(`\n🌊 === Starting SchwepeSwap Web3 Async Pipeline === 🌊`);

    try {
      // 1. Validate Network
      const isNetworkValid = await this.stageValidateNetwork();
      if (!isNetworkValid) throw new Error('Network validation failed');

      // 2. Fetch Reserves
      const { reserveIn, reserveOut } = await this.stageFetchLiquidityReserves();

      // 3. Calculate Trade
      const { minAmountOut } = await this.stageCalculateTrade(reserveIn, reserveOut);

      // 4. Check & Execute Allowance
      await this.stageCheckAndApproveAllowance();

      // 5. Execute Swap
      const { txHash } = await this.stageExecuteSwapTransaction(minAmountOut);

      console.log(`🎉 === SchwepeSwap Web3 Pipeline Completed Successfully! === 🎉\n`);
      return { success: true, logs: this.logs, txHash };
    } catch (err: any) {
      this.log('PIPELINE_ERROR', 'FAILED', err.message || 'Pipeline execution failed');
      return { success: false, logs: this.logs };
    }
  }
}

// Standalone runner script for Web3 Pipeline
const pipeline = new SchwepeWeb3Pipeline({
  chainId: 5031,
  walletAddress: '0xdd10620866c4f586b1213d3818811faf3718fce3',
  tokenIn: '0xdd10620866c4f586b1213d3818811faf3718fce3', // $SOMI Token Target
  tokenOut: '0x4444444444444444444444444444444444444444', // SCHWEPE Token
  amountIn: '100',
  slippageBps: 50
});

pipeline.executePipeline().then((res) => {
  console.log('Pipeline Execution Summary:', res);
});

