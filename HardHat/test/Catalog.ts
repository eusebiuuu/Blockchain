import { expect } from "chai";
import { AddressLike, Typed } from "ethers";
import { network } from "hardhat"
import { describe, it, beforeEach } from "node:test"

const { ethers } = await network.connect();

describe("Catalog", function () {
    let catalog:any;
    let owner;
    let addr1;

    beforeEach(async function () {
        // Get signers
        [owner, addr1] = await ethers.getSigners();
        
        // Deploy contract
        const Catalog = await ethers.getContractFactory("Catalog");
        catalog = await Catalog.deploy();
        await catalog.deployed();
    });

    describe("Product Promotion", function () {
        it("Should start a product promotion correctly", async function () {
            const productId = ethers.encodeBytes32String("100");
            
            // Add product first
            await catalog.addProduct(
                productId,
                "dummy product",
                432,
                5
            );

            // Start promotion
            await catalog.startProductPromo(
                productId,
                3,  // duration
                20  // discount
            );

            // Get product details and verify promotion
            const product = await catalog.getProduct(productId);
            expect(product.isOnSale).to.be.true;
            expect(product.discount).to.equal(20);
        });
    });
});

// describe("Catalog testing", async function () {
//     let signers: { address: AddressLike | Typed; }[] = [];

//     before(async function () {
//         signers = await ethers.getSigners();
//     });

//     it("Test start product promotion", async function () {
        
//         const catalog = await ethers.deployContract("Catalog", []);

//         const [deployer, account1] = await ethers.getSigners();
//         console.log("Account balance:", (await ethers.provider.getBalance(deployer.address).toString(), "\n"));

//         const stringToBytes32 = (str: string) => {
//             return ethers.encodeBytes32String(str);
//         };

//         catalog.addProduct(stringToBytes32("100"), "dummy product", 432, 5);
//         catalog.startProductPromo(stringToBytes32("100"), 3, 20);

//         //
//         // for (let i = 1; i <= 10; i++) {
//         //     await fidelityPoints.addPoints(signers[i].address, 2n);
//         // }

//         // const totalPoints = await fidelityPoints.getTotalPoints();

//         // Check that totalPoints matches expected sum
//         // const expectedTotal = 20n;
//         // expect(totalPoints).to.equal(expectedTotal);

//     });
// });