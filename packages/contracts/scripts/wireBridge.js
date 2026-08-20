/**
 * Wires one leg of the SCHWEPE Omnifungible Bridge to its peers and sets rate limits.
 *
 *   npx hardhat run scripts/wireBridge.js --network somnia
 *   npx hardhat run scripts/wireBridge.js --network arbitrum
 *   npx hardhat run scripts/wireBridge.js --network robinhood
 *
 * Requires all legs to be present in deployments/bridge.json.
 *
 * Peers must be set on BOTH sides of every pathway before it carries value. A one-sided
 * peer means messages leave but are rejected on arrival, stranding the transfer.
 *
 * NOTE: setPeer and setRateLimits are onlyOwner. Once ownership sits with the timelocked
 * multisig (as it must), run this with --dry-run and execute the printed calldata through
 * the multisig instead of signing directly.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { CHAINS, RATE_LIMITS } = require("../config/layerzero");

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "deployments", "bridge.json");
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

async function main() {
  const slug = hre.network.name;
  const chain = CHAINS[slug];
  if (!chain) throw new Error(`Network "${slug}" is not part of the bridge mesh`);

  if (!fs.existsSync(DEPLOYMENTS_PATH)) {
    throw new Error("deployments/bridge.json not found — run deployBridge.js on every chain first");
  }
  const deployments = JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));

  const missing = Object.keys(CHAINS).filter((s) => !deployments[s]);
  if (missing.length) {
    throw new Error(`Cannot wire the mesh yet — not deployed on: ${missing.join(", ")}`);
  }

  const self = deployments[slug];
  const contract = await hre.ethers.getContractAt(self.contract, self.address);

  console.log(`\nWiring ${self.contract} on ${slug} at ${self.address}`);
  if (DRY_RUN) console.log("   (dry run — printing calldata for multisig execution)\n");

  const limit = hre.ethers.parseEther(RATE_LIMITS.limit);
  const rateLimitConfigs = [];

  for (const [peerSlug, peer] of Object.entries(deployments)) {
    if (peerSlug === slug) continue;

    const peerBytes32 = hre.ethers.zeroPadValue(peer.address, 32);
    const current = await contract.peers(peer.eid);

    if (current.toLowerCase() === peerBytes32.toLowerCase()) {
      console.log(`   peer ${peerSlug} (eid ${peer.eid}) already set`);
    } else if (DRY_RUN) {
      console.log(`   setPeer(${peer.eid}, ${peerBytes32})`);
      console.log(`     calldata: ${contract.interface.encodeFunctionData("setPeer", [peer.eid, peerBytes32])}`);
    } else {
      const tx = await contract.setPeer(peer.eid, peerBytes32);
      await tx.wait();
      console.log(`   peer ${peerSlug} (eid ${peer.eid}) -> ${peer.address}`);
    }

    rateLimitConfigs.push({ dstEid: peer.eid, limit, window: RATE_LIMITS.windowSeconds });
  }

  console.log(
    `\n   rate limit: ${RATE_LIMITS.limit} SCHWEPE per ${RATE_LIMITS.windowSeconds}s per destination`
  );
  if (DRY_RUN) {
    console.log(
      `     calldata: ${contract.interface.encodeFunctionData("setRateLimits", [rateLimitConfigs])}`
    );
  } else {
    const tx = await contract.setRateLimits(rateLimitConfigs);
    await tx.wait();
    console.log(`   rate limits set for ${rateLimitConfigs.length} destinations`);
  }

  console.log(`\nDone. Remember: every pathway needs BOTH sides wired before it carries value.`);
  console.log(`DVN and executor config is separate — apply config/layerzero.js DVN_CONFIG via the`);
  console.log(`LayerZero CLI or endpoint setConfig before opening the bridge to users.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
