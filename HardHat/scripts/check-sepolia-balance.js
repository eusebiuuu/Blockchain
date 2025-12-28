import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const { JsonRpcProvider, formatEther } = ethers;

async function main() {
  const url = process.env.SEPOLIA_RPC_URL;
  const pk = process.env.SEPOLIA_PRIVATE_KEY;

  if (!url) {
    console.error("SEPOLIA_RPC_URL is not set in your environment (.env). Set it to your Sepolia RPC endpoint.");
    process.exit(1);
  }

  if (!pk) {
    console.error("SEPOLIA_PRIVATE_KEY is not set in your environment (.env). Set it to your private key (0x...).");
    process.exit(1);
  }

  // Create a JsonRpcProvider directly (works with Hardhat 3 regardless of plugins)
  const urlFromEnv = url;
  const provider = new JsonRpcProvider(urlFromEnv);

  // Derive wallet from provided private key and provider
  // const wallet = new Wallet(, provider);

  const balance = await provider.getBalance(process.env.METAMASK_ACCOUNT_ADDRESS);
  // console.log("Address:", provider);
  console.log("Balance (wei):", balance.toString());
  console.log("Balance (ETH):", formatEther(balance));

  const net = await provider.getNetwork();
  console.log("RPC chainId:", net.chainId, "name:", net.name);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
