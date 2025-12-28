//npx hardhat run scripts/deploy.ts --network localhost
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
    const frontendDir = path.join(dir, "../../frontend/src/contracts");

    console.log(`Copying ${frontendDir}`);

    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    const artifactsPath = path.join(hardhatDir, "artifacts/contracts");

    fs.copyFileSync(
        path.join(artifactsPath, "Catalog.sol/Catalog.json"),
        path.join(frontendDir, "Catalog.json")
    );

    fs.copyFileSync(
        path.join(artifactsPath, "FidelityPoints.sol/FidelityPoints.json"),
        path.join(frontendDir, "FidelityPoints.json")
    );

    fs.copyFileSync(
        path.join(hardhatDir, "deployed-addresses.json"),
        path.join(frontendDir, "addresses.json")
    );

    console.log("✓ Artifacts copied to frontend");
}


async function main() {
    console.log("Starting deployment...\n");

    const [deployer, account1] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address).toString(), "\n"));

    const stringToBytes32 = (str: string) => {
        return ethers.encodeBytes32String(str);
    };

    console.log("Deploying FidelityPoints...");
    const FidelityPoints = await ethers.getContractFactory("FidelityPoints");
    const pointValue = 10;
    const fidelityPoints = await FidelityPoints.deploy(pointValue);
    await fidelityPoints.waitForDeployment();
    console.log("✓ FidelityPoints deployed to:", await fidelityPoints.getAddress(), "\n");

    console.log("Deploying Catalog...");
    const Catalog = await ethers.getContractFactory("Catalog");
    const catalog = await Catalog.deploy();
    await catalog.waitForDeployment();
    console.log("✓ Catalog deployed to:", await catalog.getAddress(), "\n");

    console.log("Adding test products...");

    const products = [
        {
            code: "LAPTOP001",
            description: "High-performance gaming laptop with RTX 4080",
            price: 5000,
            stock: 10
        },
        {
            code: "PHONE001",
            description: "Latest smartphone with 5G connectivity",
            price: 3000,
            stock: 25
        },
        {
            code: "AUDIO001",
            description: "Wireless noise-cancelling headphones",
            price: 500,
            stock: 50
        },
        {
            code: "WATCH001",
            description: "Fitness tracking smartwatch with GPS",
            price: 800,
            stock: 30
        },
        {
            code: "TABLET001",
            description: "10-inch tablet perfect for reading and browsing",
            price: 1200,
            stock: 15
        },
        {
            code: "CONSOLE01",
            description: "Next-gen gaming console with 1TB storage",
            price: 4000,
            stock: 8
        },
        {
            code: "CAMERA001",
            description: "Professional mirrorless camera with 4K video",
            price: 6000,
            stock: 5
        },
        {
            code: "EREADER01",
            description: "E-ink reader with adjustable backlight",
            price: 300,
            stock: 40
        },
        {
            code: "KEYBOARD1",
            description: "Mechanical RGB gaming keyboard",
            price: 250,
            stock: 0
        },
        {
            code: "MOUSE0001",
            description: "Wireless ergonomic mouse with precision sensor",
            price: 150,
            stock: 100
        }
    ];

    for (const product of products) {
        let tx = await catalog.addProduct(
            stringToBytes32(product.code),
            product.description,
            product.price,
            product.stock
        );
        await tx.wait();
        console.log(`✓ Added product: ${product.code}`);
    }

    console.log("\n");



    const addresses = {
        fidelityPoints: await fidelityPoints.getAddress(),
        catalog: await catalog.getAddress(),
        network: "localhost",
        deployer: deployer.address
    };

    fs.writeFileSync(
        'deployed-addresses.json',
        JSON.stringify(addresses, null, 2)
    );
    console.log("Contract addresses saved to deployed-addresses.json\n");


    await copyArtifactsToFrontend();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

