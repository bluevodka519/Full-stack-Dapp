import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Starting Counter contract deployment...");

  // Get contract factory
  const Counter = await ethers.getContractFactory("Counter");

  // Deploy contract
  const counter = await Counter.deploy();

  // Wait for deployment to complete
  await counter.waitForDeployment();

  const address = await counter.getAddress();

  console.log("✅ Counter contract deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("🔗 Network:", await ethers.provider.getNetwork());

  // Test contract functionality
  console.log("\n🧪 Testing contract functionality...");

  // Read initial value
  const initialValue = await counter.x();
  console.log("Initial value:", initialValue.toString());

  // Increment counter
  console.log("Executing inc() function...");
  const tx1 = await counter.inc();
  await tx1.wait();

  const newValue = await counter.x();
  console.log("New value:", newValue.toString());

  // Increment by specified amount
  console.log("Executing incBy(5) function...");
  const tx2 = await counter.incBy(5);
  await tx2.wait();

  const finalValue = await counter.x();
  console.log("Final value:", finalValue.toString());

  console.log("\n🎉 Deployment and testing completed!");
  console.log("📋 Copy this contract address to use in frontend:");
  console.log("   ", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
