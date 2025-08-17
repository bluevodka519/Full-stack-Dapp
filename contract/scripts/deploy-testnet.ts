import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Deploy all contracts to testnet
 * This script deploys both Counter and DAppToken contracts
 */
async function main() {
  console.log("🚀 Starting testnet deployment...");
  console.log("📡 Network:", network.name);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.");
  }
  
  // Deploy Counter Contract
  console.log("\n🔢 Deploying Counter contract...");
  const counter = await ethers.deployContract("Counter");
  await counter.waitForDeployment();
  const counterAddress = await counter.getAddress();
  console.log("✅ Counter deployed to:", counterAddress);
  
  // Test Counter contract
  console.log("🧪 Testing Counter contract...");
  const initialValue = await counter.x();
  console.log("   Initial value:", initialValue.toString());
  
  // Deploy DAppToken Contract
  console.log("\n🪙 Deploying DAppToken contract...");
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  const token = await ethers.deployContract("DAppToken", [initialSupply]);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ DAppToken deployed to:", tokenAddress);
  
  // Get token information
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply()
  ]);
  
  console.log("\n📊 Token Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), symbol);
  
  // Calculate deployment costs
  const deploymentCost = balance - await ethers.provider.getBalance(deployer.address);
  console.log("\n💸 Deployment Cost:", ethers.formatEther(deploymentCost), "ETH");
  
  // Generate deployment summary
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    deploymentCost: ethers.formatEther(deploymentCost),
    contracts: {
      Counter: {
        address: counterAddress,
        initialValue: initialValue.toString()
      },
      DAppToken: {
        address: tokenAddress,
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: ethers.formatEther(totalSupply)
      }
    },
    deployedAt: new Date().toISOString()
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Verification instructions
  console.log("\n🔍 Contract Verification Commands:");
  console.log(`npx hardhat verify ${counterAddress} --network ${network.name}`);
  console.log(`npx hardhat verify ${tokenAddress} "${initialSupply}" --network ${network.name}`);
  
  // Frontend integration instructions
  console.log("\n🌐 Frontend Integration:");
  console.log("Add these addresses to your frontend configuration:");
  console.log(`Counter Contract: ${counterAddress}`);
  console.log(`DAppToken Contract: ${tokenAddress}`);
  
  // Save deployment info to file
  const fs = await import('fs');
  const deploymentFile = `deployments/${network.name}-${Date.now()}.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 Testnet deployment completed successfully!");
  
  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
