export interface TradeQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  executionPrice: number;
  minimumAmountOut: string;
  path: string[];
}

export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n) throw new Error('INSUFFICIENT_INPUT_AMOUNT');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('INSUFFICIENT_LIQUIDITY');

  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = (reserveIn * 1000n) + amountInWithFee;
  return numerator / denominator;
}

export function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountOut <= 0n) throw new Error('INSUFFICIENT_OUTPUT_AMOUNT');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('INSUFFICIENT_LIQUIDITY');

  const numerator = reserveIn * amountOut * 1000n;
  const denominator = (reserveOut - amountOut) * 997n;
  return (numerator / denominator) + 1n;
}

export function calculateSlippage(amountOut: bigint, slippageToleranceBps: number): bigint {
  const slippageMultiplier = 10000n - BigInt(slippageToleranceBps);
  return (amountOut * slippageMultiplier) / 10000n;
}

export function calculatePriceImpact(amountIn: bigint, amountOut: bigint, reserveIn: bigint, reserveOut: bigint): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  const midPrice = Number(reserveOut.toString()) / Number(reserveIn.toString());
  const actualPrice = Number(amountOut.toString()) / Number(amountIn.toString());
  const impact = Math.abs((midPrice - actualPrice) / midPrice) * 100;
  return Math.min(Math.max(impact, 0.01), 99.9);
}
