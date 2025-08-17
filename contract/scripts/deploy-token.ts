import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Deploy DAppToken contract
 * This script deploys the ERC20 token contract with initial supply
 */
async function main() {
  console.log("🚀 Starting DAppToken deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Define initial supply (1 million tokens with 18 decimals)
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 DDT
  
  console.log("🏭 Deploying DAppToken with initial supply:", ethers.formatEther(initialSupply), "DDT");
  
  // Deploy the contract
  const token = await ethers.deployContract("DAppToken", [initialSupply]);
  
  // Wait for deployment to complete
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log("✅ DAppToken deployed to:", tokenAddress);
  
  // Verify deployment by checking token details
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const owner = await token.owner();
  const deployerBalance = await token.balanceOf(deployer.address);
  
  console.log("\n📊 Token Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), symbol);
  console.log("   Owner:", owner);
  console.log("   Deployer Balance:", ethers.formatEther(deployerBalance), symbol);
  
  // Save deployment info to file for frontend use
  const deploymentInfo = {
    network: "localhost",
    tokenAddress: tokenAddress,
    tokenName: name,
    tokenSymbol: symbol,
    tokenDecimals: decimals,
    totalSupply: totalSupply.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };
  
  console.log("\n💾 Deployment completed successfully!");
  console.log("🔗 Contract Address:", tokenAddress);
  console.log("📋 Save this address for frontend integration");
  
  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
