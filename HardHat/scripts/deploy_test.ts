import { network } from "hardhat"

const { ethers } = await network.connect();

async function main() {
  const pointValue = 7;
  const newPointValue = 10;
  
  // 1. Get the ContractFactory
  const FidelityPoints = await ethers.getContractFactory("FidelityPoints");
  
  try {
    // 2. Deploy the contract
    console.log("Deploying FidelityPoints...");
    const fidelityPoints = await FidelityPoints.deploy(pointValue);
    await fidelityPoints.waitForDeployment();
    
    const address = await fidelityPoints.getAddress();
    console.log(`FidelityPoints deployed to: ${address}`);

    // 3. Call the function
    console.log(`Calling setPointValue(${newPointValue})...`);
    
    // Check initial value (optional, but good for debugging)
    const initialValue = await fidelityPoints.pointValue();
    console.log(`Initial pointValue: ${initialValue}`);

    // Call the function
    const tx = await fidelityPoints.setPointValue(newPointValue);
    await tx.wait();

    // Check new value
    const finalValue = await fidelityPoints.pointValue();
    console.log(`setPointValue call successful. New pointValue: ${finalValue}`);

  } catch (error) {
    // THIS IS WHERE THE REAL REVERT REASON WILL SHOW UP
    console.error("Deployment or configuration failed with error:");
    console.error(error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});