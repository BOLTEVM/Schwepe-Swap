const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SchwepeSwap AMM Core Suite (Somnia Network)", function () {
  let owner, alice, bob;
  let factory, router, wsomi, tokenA, tokenB, schwepe, masterChef;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy WSOMI
    const WSOMI = await ethers.getContractFactory("WSOMI");
    wsomi = await WSOMI.deploy();

    // Deploy Factory
    const SchwepeFactory = await ethers.getContractFactory("SchwepeFactory");
    factory = await SchwepeFactory.deploy(owner.address);

    // Deploy Router
    const SchwepeRouter = await ethers.getContractFactory("SchwepeRouter");
    router = await SchwepeRouter.deploy(await factory.getAddress(), await wsomi.getAddress());

    // Deploy test ERC20 tokens
    const SchwepeToken = await ethers.getContractFactory("SchwepeToken");
    tokenA = await SchwepeToken.deploy();
    tokenB = await SchwepeToken.deploy();
    schwepe = await SchwepeToken.deploy();

    // Deploy MasterChef
    const SchwepeMasterChef = await ethers.getContractFactory("SchwepeMasterChef");
    masterChef = await SchwepeMasterChef.deploy(await schwepe.getAddress(), 0);
    await schwepe.transferOwnership(await masterChef.getAddress());
  });

  it("Should create pair between TokenA and TokenB", async function () {
    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();

    await factory.createPair(tokenAAddress, tokenBAddress);
    const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);

    expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    expect(await factory.allPairsLength()).to.equal(1);
  });

  it("Should add liquidity via Router and mint LP tokens", async function () {
    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();
    const routerAddress = await router.getAddress();

    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("1000");

    await tokenA.approve(routerAddress, amountA);
    await tokenB.approve(routerAddress, amountB);

    const deadline = Math.floor(Date.now() / 1000) + 60;

    await router.addLiquidity(
      tokenAAddress,
      tokenBAddress,
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );

    const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
    const SchwepePair = await ethers.getContractFactory("SchwepePair");
    const pair = SchwepePair.attach(pairAddress);

    const lpBalance = await pair.balanceOf(owner.address);
    expect(lpBalance).to.be.gt(0);
  });

  it("Should execute swap using Constant Product AMM formula", async function () {
    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();
    const routerAddress = await router.getAddress();

    const liquidityA = ethers.parseEther("10000");
    const liquidityB = ethers.parseEther("10000");

    await tokenA.approve(routerAddress, liquidityA);
    await tokenB.approve(routerAddress, liquidityB);

    const deadline = Math.floor(Date.now() / 1000) + 600;

    await router.addLiquidity(
      tokenAAddress,
      tokenBAddress,
      liquidityA,
      liquidityB,
      0,
      0,
      owner.address,
      deadline
    );

    // Swap 100 TokenA for TokenB
    const swapAmountIn = ethers.parseEther("100");
    await tokenA.transfer(alice.address, swapAmountIn);
    await tokenA.connect(alice).approve(routerAddress, swapAmountIn);

    const aliceBalanceBefore = await tokenB.balanceOf(alice.address);

    await router.connect(alice).swapExactTokensForTokens(
      swapAmountIn,
      0,
      [tokenAAddress, tokenBAddress],
      alice.address,
      deadline
    );

    const aliceBalanceAfter = await tokenB.balanceOf(alice.address);
    expect(aliceBalanceAfter).to.be.gt(aliceBalanceBefore);
  });
});
