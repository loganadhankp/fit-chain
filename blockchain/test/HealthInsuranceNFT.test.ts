import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthInsuranceNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("HealthInsuranceNFT", function () {
  let nft: HealthInsuranceNFT;
  let owner: SignerWithAddress;
  let oracle: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;

  const BASE_PREMIUM = ethers.parseEther("1.0");
  const IPFS_HASH = "QmTestIpfsHash123456789";

  beforeEach(async function () {
    [owner, oracle, user, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("HealthInsuranceNFT");
    nft = (await Factory.deploy()) as HealthInsuranceNFT;
    await nft.waitForDeployment();

    // Grant oracle role
    await nft.addOracle(oracle.address);
  });

  // ---- Minting ----
  describe("Minting", function () {
    it("should mint a new policy NFT", async function () {
      await expect(nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH))
        .to.emit(nft, "PolicyMinted")
        .withArgs(1, user.address, BASE_PREMIUM);

      expect(await nft.ownerOf(1)).to.equal(user.address);

      const policy = await nft.policies(1);
      expect(policy.basePremium).to.equal(BASE_PREMIUM);
      expect(policy.healthScore).to.equal(0);
      expect(policy.discountPercentage).to.equal(0);
      expect(policy.coverageTier).to.equal(1); // Bronze
      expect(policy.isActive).to.be.true;
    });

    it("should increment token IDs", async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
      await nft.mintPolicy(user2.address, BASE_PREMIUM, "QmHash2");

      expect(await nft.ownerOf(1)).to.equal(user.address);
      expect(await nft.ownerOf(2)).to.equal(user2.address);
    });

    it("should track user policies", async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
      await nft.mintPolicy(user.address, BASE_PREMIUM, "QmHash2");

      const policies = await nft.getUserPolicies(user.address);
      expect(policies.length).to.equal(2);
      expect(policies[0]).to.equal(1);
      expect(policies[1]).to.equal(2);
    });

    it("should reject mint from non-admin", async function () {
      await expect(
        nft.connect(user).mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH)
      ).to.be.reverted;
    });

    it("should reject mint with zero premium", async function () {
      await expect(
        nft.mintPolicy(user.address, 0, IPFS_HASH)
      ).to.be.revertedWith("Premium must be > 0");
    });

    it("should reject mint to zero address", async function () {
      await expect(
        nft.mintPolicy(ethers.ZeroAddress, BASE_PREMIUM, IPFS_HASH)
      ).to.be.revertedWith("Invalid address");
    });
  });

  // ---- Health Score Updates ----
  describe("Health Score Updates", function () {
    beforeEach(async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
    });

    it("should update health score via oracle", async function () {
      await expect(nft.connect(oracle).updateHealthScore(1, 85))
        .to.emit(nft, "HealthScoreUpdated")
        .withArgs(1, 0, 85);

      const policy = await nft.policies(1);
      expect(policy.healthScore).to.equal(85);
    });

    it("should reject update from non-oracle", async function () {
      await expect(
        nft.connect(user).updateHealthScore(1, 85)
      ).to.be.reverted;
    });

    it("should reject score > 100", async function () {
      await expect(
        nft.connect(oracle).updateHealthScore(1, 101)
      ).to.be.revertedWith("Invalid health score");
    });

    it("should enforce 24-hour cooldown", async function () {
      await nft.connect(oracle).updateHealthScore(1, 85);

      await expect(
        nft.connect(oracle).updateHealthScore(1, 90)
      ).to.be.revertedWith("Update cooldown active");
    });

    it("should allow update after cooldown expires", async function () {
      await nft.connect(oracle).updateHealthScore(1, 85);

      // Advance time by 24 hours + 1 second
      await time.increase(24 * 60 * 60 + 1);

      await expect(nft.connect(oracle).updateHealthScore(1, 90))
        .to.emit(nft, "HealthScoreUpdated")
        .withArgs(1, 85, 90);
    });

    it("should reject update on inactive policy", async function () {
      await nft.pausePolicy(1);

      await expect(
        nft.connect(oracle).updateHealthScore(1, 85)
      ).to.be.revertedWith("Policy is not active");
    });
  });

  // ---- Discount Calculation ----
  describe("Discount Calculation", function () {
    it("should return 20% for score >= 90", async function () {
      expect(await nft.calculateDiscount(90)).to.equal(20);
      expect(await nft.calculateDiscount(100)).to.equal(20);
    });

    it("should return 15% for score 80-89", async function () {
      expect(await nft.calculateDiscount(80)).to.equal(15);
      expect(await nft.calculateDiscount(89)).to.equal(15);
    });

    it("should return 10% for score 70-79", async function () {
      expect(await nft.calculateDiscount(70)).to.equal(10);
      expect(await nft.calculateDiscount(79)).to.equal(10);
    });

    it("should return 5% for score 60-69", async function () {
      expect(await nft.calculateDiscount(60)).to.equal(5);
      expect(await nft.calculateDiscount(69)).to.equal(5);
    });

    it("should return 0% for score < 60", async function () {
      expect(await nft.calculateDiscount(59)).to.equal(0);
      expect(await nft.calculateDiscount(0)).to.equal(0);
    });
  });

  // ---- Tier Calculation ----
  describe("Tier Calculation", function () {
    it("should return Platinum (4) for score >= 85", async function () {
      expect(await nft.calculateTier(85)).to.equal(4);
      expect(await nft.calculateTier(100)).to.equal(4);
    });

    it("should return Gold (3) for score 70-84", async function () {
      expect(await nft.calculateTier(70)).to.equal(3);
      expect(await nft.calculateTier(84)).to.equal(3);
    });

    it("should return Silver (2) for score 55-69", async function () {
      expect(await nft.calculateTier(55)).to.equal(2);
      expect(await nft.calculateTier(69)).to.equal(2);
    });

    it("should return Bronze (1) for score < 55", async function () {
      expect(await nft.calculateTier(54)).to.equal(1);
      expect(await nft.calculateTier(0)).to.equal(1);
    });
  });

  // ---- Premium Calculation ----
  describe("Premium Calculation", function () {
    beforeEach(async function () {
      await nft.mintPolicy(user.address, ethers.parseEther("1.0"), IPFS_HASH);
    });

    it("should calculate full premium with no discount", async function () {
      const premium = await nft.getCurrentPremium(1);
      expect(premium).to.equal(ethers.parseEther("1.0"));
    });

    it("should apply 15% discount for score 85", async function () {
      await nft.connect(oracle).updateHealthScore(1, 85);

      const premium = await nft.getCurrentPremium(1);
      expect(premium).to.equal(ethers.parseEther("0.85")); // 15% discount
    });

    it("should apply 20% discount for score 95", async function () {
      await nft.connect(oracle).updateHealthScore(1, 95);

      const premium = await nft.getCurrentPremium(1);
      expect(premium).to.equal(ethers.parseEther("0.8")); // 20% discount
    });
  });

  // ---- Tier Upgrades via updateHealthScore ----
  describe("Tier Upgrades", function () {
    beforeEach(async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
    });

    it("should upgrade tier when score crosses threshold", async function () {
      await expect(nft.connect(oracle).updateHealthScore(1, 85))
        .to.emit(nft, "TierUpgraded")
        .withArgs(1, 1, 4); // Bronze -> Platinum
    });

    it("should not emit TierUpgraded when tier stays the same", async function () {
      await nft.connect(oracle).updateHealthScore(1, 30);

      await time.increase(24 * 60 * 60 + 1);

      // Score 40 is still Bronze
      await expect(nft.connect(oracle).updateHealthScore(1, 40))
        .to.not.emit(nft, "TierUpgraded");
    });
  });

  // ---- Policy Lifecycle ----
  describe("Policy Lifecycle", function () {
    beforeEach(async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
    });

    it("should pause a policy", async function () {
      await expect(nft.pausePolicy(1))
        .to.emit(nft, "PolicyPaused")
        .withArgs(1);

      const policy = await nft.policies(1);
      expect(policy.isActive).to.be.false;
    });

    it("should resume a policy", async function () {
      await nft.pausePolicy(1);
      await expect(nft.resumePolicy(1))
        .to.emit(nft, "PolicyResumed")
        .withArgs(1);

      const policy = await nft.policies(1);
      expect(policy.isActive).to.be.true;
    });

    it("should revoke and burn a policy", async function () {
      await expect(nft.revokePolicy(1))
        .to.emit(nft, "PolicyRevoked")
        .withArgs(1);

      await expect(nft.ownerOf(1)).to.be.reverted;
    });
  });

  // ---- Transfer ----
  describe("Transfer", function () {
    beforeEach(async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
    });

    it("should update policyHolder on transfer", async function () {
      await nft.connect(user).transferFrom(user.address, user2.address, 1);

      expect(await nft.ownerOf(1)).to.equal(user2.address);

      const policy = await nft.policies(1);
      expect(policy.policyHolder).to.equal(user2.address);

      const user1Policies = await nft.getUserPolicies(user.address);
      expect(user1Policies.length).to.equal(0);

      const user2Policies = await nft.getUserPolicies(user2.address);
      expect(user2Policies.length).to.equal(1);
    });
  });

  // ---- Emergency Pause ----
  describe("Emergency Pause", function () {
    it("should prevent minting when paused", async function () {
      await nft.pause();

      await expect(
        nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH)
      ).to.be.reverted;
    });

    it("should allow minting after unpause", async function () {
      await nft.pause();
      await nft.unpause();

      await expect(
        nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH)
      ).to.not.be.reverted;
    });
  });

  // ---- Gas Estimation ----
  describe("Gas Usage", function () {
    it("should use reasonable gas for minting", async function () {
      const tx = await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
      const receipt = await tx.wait();

      console.log(`    Mint gas used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(300000n);
    });

    it("should use reasonable gas for health score update", async function () {
      await nft.mintPolicy(user.address, BASE_PREMIUM, IPFS_HASH);
      const tx = await nft.connect(oracle).updateHealthScore(1, 85);
      const receipt = await tx.wait();

      console.log(`    Update gas used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(150000n);
    });
  });
});

