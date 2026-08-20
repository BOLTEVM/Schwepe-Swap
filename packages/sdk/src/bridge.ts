import { ethers } from 'ethers';
import { BRIDGE_CHAINS, BRIDGE_HOME_CHAIN_ID, bridgeChain, bridgeChainByEid } from './constants.ts';

/**
 * SCHWEPE Omnifungible Bridge — LayerZero V2 OFT client.
 *
 * Somnia holds the real token in a vault (SchwepeOFTAdapter); Arbitrum and Robinhood Chain
 * run SchwepeOFT mirrors. This module quotes fees, builds send params, and submits transfers.
 * Delivery status is polled from the indexer, not from chain directly.
 */

/** Minimal IOFT surface — quoteSend/send plus the rate limiter and vault views we expose in the UI. */
export const OFT_ABI = [
  'function quoteSend((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam, bool payInLzToken) view returns ((uint256 nativeFee,uint256 lzTokenFee))',
  'function send((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam, (uint256 nativeFee,uint256 lzTokenFee) fee, address refundAddress) payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee), (uint256 amountSentLD,uint256 amountReceivedLD))',
  'function quoteOFT((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam) view returns ((uint256 minAmountLD,uint256 maxAmountLD), (int256 feeAmountLD,string description)[], (uint256 amountSentLD,uint256 amountReceivedLD))',
  'function token() view returns (address)',
  'function approvalRequired() view returns (bool)',
  'function getAmountCanBeSent(uint32 dstEid) view returns (uint256 currentAmountInFlight, uint256 amountCanBeSent)',
  'function peers(uint32 eid) view returns (bytes32)',
  'function paused() view returns (bool)',
  'function totalLocked() view returns (uint256)'
];

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

export interface BridgeRoute {
  from: number;
  to: number;
}

export interface BridgeQuote {
  /** Native gas token owed to LayerZero for delivery, in wei. */
  nativeFee: bigint;
  /** Amount debited on the source chain, after OFT dust removal. */
  amountSent: bigint;
  /** Amount that will land on the destination chain. */
  amountReceived: bigint;
  /** Dust truncated by OFT shared-decimal rounding. Refunded to nobody — it simply is not sent. */
  dust: bigint;
}

export class BridgeError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'BridgeError';
  }
}

/** Chains reachable from `chainId`. Spokes route through Somnia conceptually but send direct. */
export function bridgeDestinations(chainId: number) {
  return Object.values(BRIDGE_CHAINS).filter((c) => c.chainId !== chainId);
}

export function assertRoute({ from, to }: BridgeRoute) {
  const src = bridgeChain(from);
  const dst = bridgeChain(to);
  if (!src) throw new BridgeError(`${from} is not a bridge chain`, 'UNSUPPORTED_SOURCE');
  if (!dst) throw new BridgeError(`${to} is not a bridge chain`, 'UNSUPPORTED_DESTINATION');
  if (from === to) throw new BridgeError('Source and destination are the same chain', 'SAME_CHAIN');
  if (!src.bridge) throw new BridgeError(`Bridge is not deployed on ${src.name} yet`, 'NOT_DEPLOYED');
  if (!dst.bridge) throw new BridgeError(`Bridge is not deployed on ${dst.name} yet`, 'NOT_DEPLOYED');
  return { src, dst };
}

/** LayerZero executor options: type-3 header + lzReceive gas. */
export function buildExtraOptions(gasLimit = 200_000n): string {
  const TYPE_3 = '0x0003';
  const WORKER_EXECUTOR = '01';
  const OPTION_TYPE_LZRECEIVE = '01';
  const gasHex = gasLimit.toString(16).padStart(32, '0');
  // 1 byte option type + 16 bytes gas = 17 bytes of option payload
  const size = (17).toString(16).padStart(4, '0');
  return `${TYPE_3}${WORKER_EXECUTOR}${size}${OPTION_TYPE_LZRECEIVE}${gasHex}`;
}

export function toBytes32(address: string): string {
  return ethers.zeroPadValue(ethers.getAddress(address), 32);
}

export function buildSendParam(
  route: BridgeRoute,
  recipient: string,
  amount: bigint,
  slippageBps = 0,
  gasLimit?: bigint
) {
  const { dst } = assertRoute(route);
  const minAmount = slippageBps > 0 ? (amount * BigInt(10_000 - slippageBps)) / 10_000n : amount;

  return {
    dstEid: dst.eid,
    to: toBytes32(recipient),
    amountLD: amount,
    minAmountLD: minAmount,
    extraOptions: buildExtraOptions(gasLimit),
    composeMsg: '0x',
    oftCmd: '0x'
  };
}

function contractFor(route: BridgeRoute, runner: ethers.ContractRunner) {
  const { src } = assertRoute(route);
  return new ethers.Contract(src.bridge, OFT_ABI, runner);
}

/**
 * Quote a bridge transfer: LayerZero delivery fee plus the exact amount that will arrive.
 *
 * OFT truncates to shared decimals (6), so a transfer of 1.0000001 SCHWEPE sends 1.000000.
 * The `dust` field surfaces that so the UI can show it rather than silently losing it.
 */
export async function quoteBridge(
  route: BridgeRoute,
  recipient: string,
  amount: bigint,
  provider: ethers.ContractRunner,
  slippageBps = 0
): Promise<BridgeQuote> {
  const oft = contractFor(route, provider);
  const sendParam = buildSendParam(route, recipient, amount, slippageBps);

  const [, , receipt] = await oft.quoteOFT(sendParam);
  const fee = await oft.quoteSend(sendParam, false);

  const amountSent = BigInt(receipt.amountSentLD);
  const amountReceived = BigInt(receipt.amountReceivedLD);

  return {
    nativeFee: BigInt(fee.nativeFee),
    amountSent,
    amountReceived,
    dust: amount - amountSent
  };
}

/**
 * Ensure the vault adapter can pull SCHWEPE. Only needed on the home chain — on spokes the
 * OFT contract is the token itself and needs no approval.
 */
export async function ensureBridgeApproval(
  route: BridgeRoute,
  amount: bigint,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse | null> {
  const { src } = assertRoute(route);
  if (src.chainId !== BRIDGE_HOME_CHAIN_ID) return null;

  const owner = await signer.getAddress();
  const token = new ethers.Contract(src.token, ERC20_ABI, signer);
  const allowance: bigint = await token.allowance(owner, src.bridge);
  if (allowance >= amount) return null;

  return token.approve(src.bridge, amount);
}

/**
 * Submit a bridge transfer. Returns the LayerZero guid, which is how the indexer and the
 * UI track delivery on the destination chain.
 */
export async function bridgeSend(
  route: BridgeRoute,
  recipient: string,
  amount: bigint,
  signer: ethers.Signer,
  slippageBps = 0
): Promise<{ hash: string; guid: string | null }> {
  const oft = contractFor(route, signer);
  const sendParam = buildSendParam(route, recipient, amount, slippageBps);
  const fee = await oft.quoteSend(sendParam, false);
  const refundTo = await signer.getAddress();

  const tx = await oft.send(sendParam, fee, refundTo, { value: fee.nativeFee });
  const receipt = await tx.wait();

  return { hash: tx.hash, guid: extractGuid(receipt) };
}

/** Pulls the LayerZero guid out of the OFTSent event in a send receipt. */
export function extractGuid(receipt: ethers.TransactionReceipt | null): string | null {
  if (!receipt) return null;
  const OFT_SENT = ethers.id('OFTSent(bytes32,uint32,address,uint256,uint256)');
  const log = receipt.logs.find((l) => l.topics[0] === OFT_SENT);
  return log ? log.topics[1] : null;
}

/** Remaining sendable amount toward a destination before the rate limit bites. */
export async function availableToSend(
  route: BridgeRoute,
  provider: ethers.ContractRunner
): Promise<bigint> {
  const { dst } = assertRoute(route);
  const oft = contractFor(route, provider);
  const [, canBeSent] = await oft.getAmountCanBeSent(dst.eid);
  return BigInt(canBeSent);
}

/**
 * Verify a pathway is actually open before offering it in the UI: both sides wired,
 * neither side paused.
 */
export async function isRouteOpen(
  route: BridgeRoute,
  srcProvider: ethers.ContractRunner,
  dstProvider: ethers.ContractRunner
): Promise<boolean> {
  const { src, dst } = assertRoute(route);
  const srcOft = new ethers.Contract(src.bridge, OFT_ABI, srcProvider);
  const dstOft = new ethers.Contract(dst.bridge, OFT_ABI, dstProvider);

  const [srcPeer, dstPeer, srcPaused, dstPaused] = await Promise.all([
    srcOft.peers(dst.eid),
    dstOft.peers(src.eid),
    srcOft.paused(),
    dstOft.paused()
  ]);

  return (
    srcPeer.toLowerCase() === toBytes32(dst.bridge).toLowerCase() &&
    dstPeer.toLowerCase() === toBytes32(src.bridge).toLowerCase() &&
    !srcPaused &&
    !dstPaused
  );
}

/**
 * The bridge's core solvency check: real SCHWEPE locked on Somnia must equal total mirror
 * supply across every spoke. Any drift means mirrors are unbacked.
 */
export async function verifyBacking(
  providers: Record<number, ethers.ContractRunner>
): Promise<{ locked: bigint; minted: bigint; solvent: boolean }> {
  const home = bridgeChain(BRIDGE_HOME_CHAIN_ID);
  if (!home?.bridge) throw new BridgeError('Home vault is not deployed', 'NOT_DEPLOYED');

  const vault = new ethers.Contract(home.bridge, OFT_ABI, providers[BRIDGE_HOME_CHAIN_ID]);
  const locked: bigint = await vault.totalLocked();

  let minted = 0n;
  for (const chain of Object.values(BRIDGE_CHAINS)) {
    if (chain.role !== 'spoke' || !chain.bridge) continue;
    const provider = providers[chain.chainId];
    if (!provider) continue;
    const mirror = new ethers.Contract(chain.bridge, ERC20_ABI.concat(['function totalSupply() view returns (uint256)']), provider);
    minted += BigInt(await mirror.totalSupply());
  }

  return { locked, minted, solvent: locked >= minted };
}

export { bridgeChain, bridgeChainByEid, BRIDGE_CHAINS, BRIDGE_HOME_CHAIN_ID };
