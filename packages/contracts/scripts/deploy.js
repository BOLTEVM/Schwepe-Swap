const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying SchwepeSwap Smart Contracts on Somnia Network with account:", deployer.address);

  // 1. Deploy WSOMI (Wrapped SOMI)
  const WSOMI = await hre.ethers.getContractFactory("WSOMI");
  const wsomi = await WSOMI.deploy();
  await wsomi.waitForDeployment();
  const wsomiAddress = await wsomi.getAddress();
  console.log("✅ WSOMI Deployed at:", wsomiAddress);

  // 2. Deploy SchwepeFactory
  const SchwepeFactory = await hre.ethers.getContractFactory("SchwepeFactory");
  const factory = await SchwepeFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ SchwepeFactory Deployed at:", factoryAddress);

  // 3. Deploy SchwepeRouter
  const SchwepeRouter = await hre.ethers.getContractFactory("SchwepeRouter");
  const router = await SchwepeRouter.deploy(factoryAddress, wsomiAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ SchwepeRouter Deployed at:", routerAddress);

  // 4. Deploy SCHWEPE Token
  const SchwepeToken = await hre.ethers.getContractFactory("SchwepeToken");
  const token = await SchwepeToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ SCHWEPE Token Deployed at:", tokenAddress);

  // 5. Deploy MasterChef
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  const SchwepeMasterChef = await hre.ethers.getContractFactory("SchwepeMasterChef");
  const masterChef = await SchwepeMasterChef.deploy(tokenAddress, currentBlock);
  await masterChef.waitForDeployment();
  const masterChefAddress = await masterChef.getAddress();
  console.log("✅ SchwepeMasterChef Deployed at:", masterChefAddress);

  // Transfer ownership of SCHWEPE token to MasterChef for farming rewards
  await token.transferOwnership(masterChefAddress);
  console.log("🔒 SCHWEPE Token Ownership transferred to MasterChef!");

  console.log("\n--- Somnia Deployment Summary ---");
  console.log({
    Network: hre.network.name,
    ChainID: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    WSOMI: wsomiAddress,
    Factory: factoryAddress,
    Router: routerAddress,
    SCHWEPE_Token: tokenAddress,
    MasterChef: masterChefAddress,
    SOMITokenTarget: "0xdd10620866c4f586b1213d3818811faf3718fce3"
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
