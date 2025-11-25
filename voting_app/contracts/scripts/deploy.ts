//npx hardhat run scripts/deploy.ts --network localhost
//Example with named parameters using environment variables:
//for Windows $env:REGDAYS=7; $env:VOTEDAYS=14; $env:MAXVOTES=3; npx hardhat run scripts/deploy.ts --network localhost
//REGDAYS=7 VOTEDAYS=14 MAXVOTES=3 npx hardhat run scripts/deploy.ts --network localhost
//Or use individual parameters:
//REGDAYS=10 MAXVOTES=5 npx hardhat run scripts/deploy.ts --network localhost
import { network } from "hardhat";

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { ethers } = await network.connect();

const filename = fileURLToPath(import.meta.url);
const dir = dirname(filename);

async function copyArtifactsToFrontend() {
    const hardhatDir = path.join(dir, "..");
    const frontendDir = path.join(dir, "../../src/contracts");

    console.log(`Copying ${frontendDir}`);

    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    const artifactsPath = path.join(hardhatDir, "artifacts/contracts");

    fs.copyFileSync(
        path.join(artifactsPath, "Voting.sol/Voting.json"),
        path.join(frontendDir, "Voting.json")
    );

    fs.copyFileSync(
        path.join(hardhatDir, "deployed-addresses.json"),
        path.join(frontendDir, "addresses.json")
    );

    console.log("✓ Artifacts copied to frontend");
}


async function main() {
    console.log("Starting deployment...\n");

    // Read parameters from environment variables
    // Default values
    let regdays = 7;    // Registration period in days
    let votedays = 14;  // Voting period in days
    let maxvotes = 3;   // Maximum votes per voter

    if (process.env.REGDAYS) {
        regdays = parseInt(process.env.REGDAYS);
    }
    if (process.env.VOTEDAYS) {
        votedays = parseInt(process.env.VOTEDAYS);
    }
    if (process.env.MAXVOTES) {
        maxvotes = parseInt(process.env.MAXVOTES);
    }

    const hasCustomParams = process.env.REGDAYS || process.env.VOTEDAYS || process.env.MAXVOTES;

    if (hasCustomParams) {
        console.log("Using custom deployment parameters:");
    } else {
        console.log("Using default deployment parameters:");
    }

    console.log(`  Registration period: ${regdays} days`);
    console.log(`  Voting period: ${votedays} days`);
    console.log(`  Max votes per voter: ${maxvotes}`);
    console.log();

    const [deployer, account1, account2, account3] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString(), "\n");

    const stringToBytes32 = (str: string) => {
        return ethers.encodeBytes32String(str);
    };

    console.log("Deploying Voting...");
    const Voting = await ethers.getContractFactory("Voting");

    const voting = await Voting.deploy(regdays, votedays, maxvotes);
    await voting.waitForDeployment();

    const votingAddress = await voting.getAddress();
    console.log("✓ Voting deployed to:", votingAddress, "\n");


    console.log("Adding test project proposals...");

    const proposals = [
        {
            projectName: "DeFi Yield Aggregator",
            teamName: "CryptoVault",
            gitAddress: "https://github.com/cryptovault/defi-yield-aggregator",
            participant1: "Alice Nakamoto",
            participant2: "Bob Vitalik"
        },
        {
            projectName: "NFT Marketplace",
            teamName: "MetaCollectors",
            gitAddress: "https://github.com/metacollectors/nft-marketplace",
            participant1: "Carol Buterin",
            participant2: "David Satoshi"
        },
        {
            projectName: "DAO Governance Tool",
            teamName: "ChainVoters",
            gitAddress: "https://github.com/chainvoters/dao-governance",
            participant1: "Eve Ethereum",
            participant2: "Frank Polygon"
        },
        {
            projectName: "DeFi Lending Protocol",
            teamName: "LiquidStake",
            gitAddress: "https://github.com/liquidstake/lending-protocol",
            participant1: "Grace Solana",
            participant2: "Henry Avalanche"
        },
        {
            projectName: "Cross-Chain Bridge",
            teamName: "ChainLink Bridge",
            gitAddress: "https://github.com/chainlinkbridge/cross-chain",
            participant1: "Ivy Cardano",
            participant2: "Jack Cosmos"
        }
    ];

    // Register proposals from different accounts
    const accounts = [deployer, account1, account2, account3, deployer];

    for (let i = 0; i < proposals.length && i < accounts.length; i++) {
        const proposal = proposals[i];
        try {
            const tx = await voting.connect(accounts[i]).registerProposal(
                stringToBytes32(proposal.projectName),
                proposal.teamName,
                proposal.gitAddress,
                proposal.participant1,
                proposal.participant2
            );
            await tx.wait();
            console.log(`✓ Added proposal ${i}: ${proposal.projectName} by ${proposal.teamName}`);
            console.log(`  Git: ${proposal.gitAddress}`);
        } catch (error: any) {
            console.log(`✗ Failed to add proposal ${i}: ${error.message}`);
        }
    }

    console.log("\nSetting proposal states to Active...");

    // Set all proposals to Active state (State.Active = 0)
    const numProposals = await voting.getNumberOfProposals();
    for (let i = 0; i < numProposals; i++) {
        try {
            const tx = await voting.setProposalState(i, 0); // 0 = Active
            await tx.wait();
            console.log(`✓ Set proposal ${i} to Active`);
        } catch (error: any) {
            console.log(`✗ Failed to set proposal ${i} state: ${error.message}`);
        }
    }

    console.log("\n✓ Deployment complete!\n");


    const addresses = {
        voting: votingAddress,
        deployer: deployer.address,
        deploymentParams: {
            regdays: regdays,
            votedays: votedays,
            maxvotes: maxvotes
        }
    };

    fs.writeFileSync(
        'deployed-addresses.json',
        JSON.stringify(addresses, null, 2)
    );
    console.log("Contract addresses saved to deployed-addresses.json");
    console.log();

    await copyArtifactsToFrontend();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });