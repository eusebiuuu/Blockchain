import dotenv from "dotenv"
import { ethers } from 'ethers'

dotenv.config();

async function main() {
  const { JsonRpcProvider, parseEther, Wallet } = ethers;
  const url = process.env.SEPOLIA_RPC_URL;
  const pk = process.env.SEPOLIA_PRIVATE_KEY;

  if (!url) {
    console.error('SEPOLIA_RPC_URL not set');
    process.exit(1);
  }
  if (!pk) {
    console.error('SEPOLIA_PRIVATE_KEY not set');
    process.exit(1);
  }

  const provider = new JsonRpcProvider(url);
  const wallet = new Wallet(pk, provider);

//   console.log('Using address:', wallet.address);

  const tx = {
    // to: wallet.address,
    value: parseEther('0.0'),
  };

  try {
    const sent = await wallet.sendTransaction(tx);
    console.log('Sent tx hash:', sent.hash);
    const receipt = await sent.wait();
    console.log('Receipt:', receipt);
  } catch (err) {
    console.error('Error sending tx:', err);
    process.exitCode = 1;
  }
}

main();
