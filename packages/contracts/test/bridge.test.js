const { expect } = require("chai");
const { ethers } = require("hardhat");

const SOMNIA_EID = 30380;
const ARBITRUM_EID = 30110;
const ROBINHOOD_EID = 30416;

const ONE_HOUR = 3600;
const LIMIT = ethers.parseEther("5000000");

describe("SCHWEPE Omnifungible Bridge", function () {
  let owner, user, other;
  let schwepe, adapter, oft;
  let snapshotId;

  // The rate-limit tests advance the chain clock. Without snapshot isolation that leak
  // expires the deadline-based AMM tests that run after this file.
  beforeEach(async function () {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
    [owner, user, other] = await ethers.getSigners();

    const MockSchwepe = await ethers.getContractFactory("MockSchwepe");
    schwepe = await MockSchwepe.deploy();

    // The harnesses never call the endpoint, so a placeholder address is enough here.
    const endpointA = await (await ethers.getContractFactory("EndpointV2Mock")).deploy(
      SOMNIA_EID,
      owner.address
    );
    const endpointB = await (await ethers.getContractFactory("EndpointV2Mock")).deploy(
      ARBITRUM_EID,
      owner.address
    );

    adapter = await (await ethers.getContractFactory("SchwepeOFTAdapterHarness")).deploy(
      await schwepe.getAddress(),
      await endpointA.getAddress(),
      owner.address
    );
    oft = await (await ethers.getContractFactory("SchwepeOFTHarness")).deploy(
      await endpointB.getAddress(),
      owner.address
    );

    await adapter.setRateLimits([
      { dstEid: ARBITRUM_EID, limit: LIMIT, window: ONE_HOUR },
      { dstEid: ROBINHOOD_EID, limit: LIMIT, window: ONE_HOUR }
    ]);
    await oft.setRateLimits([{ dstEid: SOMNIA_EID, limit: LIMIT, window: ONE_HOUR }]);

    await schwepe.transfer(user.address, ethers.parseEther("10000000"));
    await schwepe.connect(user).approve(await adapter.getAddress(), ethers.MaxUint256);
  });

  afterEach(async function () {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  describe("vault accounting", function () {
    it("locks real SCHWEPE and tracks totalLocked", async function () {
      const amount = ethers.parseEther("1000");
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);

      expect(await adapter.totalLocked()).to.equal(amount);
      expect(await schwepe.balanceOf(await adapter.getAddress())).to.equal(amount);
    });

    it("releases locked SCHWEPE on the way home and decrements totalLocked", async function () {
      const amount = ethers.parseEther("1000");
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);

      const before = await schwepe.balanceOf(other.address);
      await adapter.credit(other.address, amount, ARBITRUM_EID);

      expect(await schwepe.balanceOf(other.address)).to.equal(before + amount);
      expect(await adapter.totalLocked()).to.equal(0n);
    });

    it("never releases more than is locked", async function () {
      const amount = ethers.parseEther("1000");
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);

      await expect(
        adapter.credit(other.address, amount + 1n, ARBITRUM_EID)
      ).to.be.revertedWithCustomError(adapter, "InsufficientLocked");
    });

    it("rejects a lossy transfer rather than minting unbacked mirror supply", async function () {
      await schwepe.setFeeBps(100); // 1% transfer fee
      const amount = ethers.parseEther("1000");

      await expect(
        adapter.debit(user.address, amount, amount, ARBITRUM_EID)
      ).to.be.revertedWithCustomError(adapter, "LossyTransfer");

      expect(await adapter.totalLocked()).to.equal(0n);
    });

    it("surfaces tokens sent to the vault by mistake as unaccounted balance", async function () {
      const amount = ethers.parseEther("1000");
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);
      expect(await adapter.unaccountedBalance()).to.equal(0n);

      await schwepe.connect(user).transfer(await adapter.getAddress(), ethers.parseEther("5"));
      expect(await adapter.unaccountedBalance()).to.equal(ethers.parseEther("5"));
    });

    it("cannot sweep the backing balance, only the surplus", async function () {
      const amount = ethers.parseEther("1000");
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);
      await schwepe.connect(user).transfer(await adapter.getAddress(), ethers.parseEther("5"));

      await expect(
        adapter.sweep(await schwepe.getAddress(), owner.address, ethers.parseEther("6"))
      ).to.be.revertedWithCustomError(adapter, "InsufficientLocked");

      await adapter.sweep(await schwepe.getAddress(), owner.address, ethers.parseEther("5"));
      expect(await adapter.totalLocked()).to.equal(amount);
      expect(await schwepe.balanceOf(await adapter.getAddress())).to.equal(amount);
    });

    it("only the owner can sweep", async function () {
      await expect(
        adapter.connect(user).sweep(await schwepe.getAddress(), user.address, 1n)
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });
  });

  describe("supply invariant", function () {
    it("mirror supply minted on the spoke equals SCHWEPE locked in the vault", async function () {
      const amount = ethers.parseEther("250000");

      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);
      await oft.credit(user.address, amount, SOMNIA_EID);

      expect(await oft.totalSupply()).to.equal(await adapter.totalLocked());
      expect(await oft.balanceOf(user.address)).to.equal(amount);
    });

    it("burning the mirror and unlocking at home returns supply to zero", async function () {
      const amount = ethers.parseEther("250000");

      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);
      await oft.credit(user.address, amount, SOMNIA_EID);

      await oft.debit(user.address, amount, amount, SOMNIA_EID);
      await adapter.credit(user.address, amount, ARBITRUM_EID);

      expect(await oft.totalSupply()).to.equal(0n);
      expect(await adapter.totalLocked()).to.equal(0n);
    });

    it("the spoke mirror has no owner mint path", async function () {
      expect(oft.interface.getFunction("mint")).to.equal(null);
    });
  });

  describe("rate limiting", function () {
    it("blocks sends above the window limit", async function () {
      // Kept dust-free so OFT decimal truncation cannot trip slippage before the rate limit.
      const over = LIMIT + ethers.parseEther("1");
      await schwepe.transfer(user.address, over);

      await expect(
        adapter.debit(user.address, over, over, ARBITRUM_EID)
      ).to.be.revertedWithCustomError(adapter, "RateLimitExceeded");
    });

    it("refuses to send toward a chain with no configured limit", async function () {
      const unconfiguredEid = 30101;
      const amount = ethers.parseEther("1");

      await expect(
        adapter.debit(user.address, amount, amount, unconfiguredEid)
      ).to.be.revertedWithCustomError(adapter, "RateLimitExceeded");
    });

    it("refills capacity as the window elapses", async function () {
      const amount = LIMIT;
      await schwepe.transfer(user.address, amount);
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);

      // getAmountCanBeSent returns (currentAmountInFlight, amountCanBeSent).
      const [inFlight, canSend] = await adapter.getAmountCanBeSent(ARBITRUM_EID);
      expect(inFlight).to.be.greaterThan(0n);
      // The window decays continuously, so a little capacity has already returned.
      expect(canSend).to.be.lessThan(LIMIT / 100n);

      await ethers.provider.send("evm_increaseTime", [ONE_HOUR]);
      await ethers.provider.send("evm_mine", []);

      const [inFlightAfter, canSendAfter] = await adapter.getAmountCanBeSent(ARBITRUM_EID);
      expect(inFlightAfter).to.equal(0n);
      expect(canSendAfter).to.equal(LIMIT);
    });

    it("only the owner can change rate limits", async function () {
      await expect(
        adapter.connect(user).setRateLimits([{ dstEid: ARBITRUM_EID, limit: LIMIT, window: ONE_HOUR }])
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });
  });

  describe("pause", function () {
    it("halts both directions on the vault", async function () {
      const amount = ethers.parseEther("1000");
      await adapter.debit(user.address, amount, amount, ARBITRUM_EID);
      await adapter.pause();

      await expect(
        adapter.debit(user.address, amount, amount, ARBITRUM_EID)
      ).to.be.revertedWithCustomError(adapter, "EnforcedPause");
      await expect(
        adapter.credit(user.address, amount, ARBITRUM_EID)
      ).to.be.revertedWithCustomError(adapter, "EnforcedPause");

      await adapter.unpause();
      await adapter.credit(user.address, amount, ARBITRUM_EID);
      expect(await adapter.totalLocked()).to.equal(0n);
    });

    it("halts both directions on the spoke mirror", async function () {
      const amount = ethers.parseEther("1000");
      await oft.pause();

      await expect(
        oft.credit(user.address, amount, SOMNIA_EID)
      ).to.be.revertedWithCustomError(oft, "EnforcedPause");
    });

    it("only the owner can pause", async function () {
      await expect(adapter.connect(user).pause()).to.be.revertedWithCustomError(
        adapter,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("peer configuration", function () {
    it("starts with no peers, so no chain is reachable until explicitly wired", async function () {
      expect(await adapter.peers(ARBITRUM_EID)).to.equal(ethers.ZeroHash);
      expect(await oft.peers(SOMNIA_EID)).to.equal(ethers.ZeroHash);
    });

    it("only the owner can set peers", async function () {
      const peer = ethers.zeroPadValue(await oft.getAddress(), 32);
      await expect(
        adapter.connect(user).setPeer(ARBITRUM_EID, peer)
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");

      await adapter.setPeer(ARBITRUM_EID, peer);
      expect(await adapter.peers(ARBITRUM_EID)).to.equal(peer);
    });
  });
});
