import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ethers"

import dotenv from "dotenv";
dotenv.config()

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, HardhatIgnitionEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    localhost: {
        url: "http://127.0.0.1:8545",
        chainId: 31337,
        type: "http"
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      gasPrice: "auto",
      url: process.env.SEPOLIA_RPC_URL as string,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY as string],
    },
  },
};

export default config;
