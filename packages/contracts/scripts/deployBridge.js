/**
 * Deploys one leg of the SCHWEPE Omnifungible Bridge.
 *
 *   Somnia   -> SchwepeOFTAdapter (vault holding the live SCHWEPE)
 *   Arbitrum -> SchwepeOFT mirror
 *   Robinhood-> SchwepeOFT mirror
 *
 * Run once per chain, then wire the mesh with wireBridge.js:
 *   npx hardhat run scripts/deployBridge.js --network somnia
 *   npx hardhat run scripts/deployBridge.js --network arbitrum
 *   npx hardhat run scripts/deployBridge.js --network robinhood
 *
 * BRIDGE_OWNER must be a timelocked multisig. The script refuses to deploy without it
 * rather than silently leaving an EOA in control of the vault.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { CHAINS } = require("../config/layerzero");

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "deployments", "bridge.json");

function readDeployments() {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) return {};
  return JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));
}

function writeDeployments(data) {
  fs.mkdirSync(path.dirname(DEPLOYMENTS_PATH), { recursive: true });
  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const slug = hre.network.name;
  const chain = CHAINS[slug];
  if (!chain) {
    throw new Error(
      `Network "${slug}" is not part of the bridge mesh. Expected one of: ${Object.keys(CHAINS).join(", ")}`
    );
  }

  const actualChainId = Number((await hre.ethers.provider.getNetwork()).chainId);
  if (actualChainId !== chain.chainId) {
    throw new Error(`Connected to chainId ${actualChainId} but "${slug}" expects ${chain.chainId}`);
  }

  const owner = process.env.BRIDGE_OWNER;
  if (!owner || !hre.ethers.isAddress(owner)) {
    throw new Error("BRIDGE_OWNER must be set to the timelocked multisig that will own the bridge");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\nDeploying SCHWEPE bridge on ${slug} (chainId ${chain.chainId}, eid ${chain.eid})`);
  console.log(`   deployer: ${deployer.address}`);
  console.log(`   owner:    ${owner}`);
  console.log(`   endpoint: ${chain.endpointV2}`);

  let contract;
  let contractName;

  if (chain.role === "home") {
    contractName = "SchwepeOFTAdapter";
    console.log(`   locking:  ${chain.innerToken} (live SCHWEPE)`);

    const code = await hre.ethers.provider.getCode(chain.innerToken);
    if (code === "0x") throw new Error(`No contract at ${chain.innerToken} — refusing to deploy a vault over nothing`);

    const Adapter = await hre.ethers.getContractFactory(contractName);
    contract = await Adapter.deploy(chain.innerToken, chain.endpointV2, owner);
  } else {
    contractName = "SchwepeOFT";
    const OFT = await hre.ethers.getContractFactory(contractName);
    contract = await OFT.deploy(chain.endpointV2, owner);
  }

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`\n${contractName} deployed at ${address}`);
  console.log(`   ${chain.explorer}/address/${address}`);

  const deployments = readDeployments();
  deployments[slug] = {
    contract: contractName,
    address,
    chainId: chain.chainId,
    eid: chain.eid,
    endpointV2: chain.endpointV2,
    owner,
    innerToken: chain.innerToken || null,
    deployedAt: new Date().toISOString()
  };
  writeDeployments(deployments);
  console.log(`\nRecorded in deployments/bridge.json`);

  const remaining = Object.keys(CHAINS).filter((s) => !deployments[s]);
  if (remaining.length) {
    console.log(`Still to deploy: ${remaining.join(", ")}`);
  } else {
    console.log(`All legs deployed. Next: npx hardhat run scripts/wireBridge.js --network <chain>`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
