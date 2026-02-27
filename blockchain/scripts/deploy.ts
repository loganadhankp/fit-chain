import { ethers } from "hardhat";

async function main() {
  console.log("Deploying HealthInsuranceNFT...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const HealthInsuranceNFT = await ethers.getContractFactory("HealthInsuranceNFT");
  const nft = await HealthInsuranceNFT.deploy();
  await nft.waitForDeployment();

  const contractAddress = await nft.getAddress();
  console.log(`HealthInsuranceNFT deployed to: ${contractAddress}`);

  // If an oracle wallet address is set, grant it the ORACLE_ROLE
  const oracleAddress = process.env.ORACLE_WALLET_ADDRESS;
  if (oracleAddress && oracleAddress !== "0x_YOUR_ORACLE_WALLET_ADDRESS") {
    const tx = await nft.addOracle(oracleAddress);
    await tx.wait();
    console.log(`Oracle role granted to: ${oracleAddress}`);
  }

  console.log("\n--- Deployment Summary ---");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Network:  ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("\nUpdate your .env file:");
  console.log(`NFT_CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

