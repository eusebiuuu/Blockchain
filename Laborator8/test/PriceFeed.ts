import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.connect();


describe("DataConsumerV3 - Chainlink Price Feed", function () {
    let dataConsumer: any;
    const dataFeedAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
    const dataConsumerAddress = "0x6B90DfA97e65db7Dd6dd4dc3DEcb579f7Ad3508E"

    const aggregatorV3InterfaceABI = [
        "function decimals() external view returns (uint8)",
        "function description() external view returns (string memory)",
        "function version() external view returns (uint256)",
        "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
    ];


    beforeEach(async function () {

        // Load existing contract at deployed address
        dataConsumer = await ethers.getContractAt(
            "DataConsumerV3",
            dataConsumerAddress
        );

        console.log("Loaded DataConsumerV3 at:", dataConsumerAddress);
    });

    it("Should retrieve BTC/USD price from Chainlink", async function () {
        const price = await dataConsumer.getChainlinkDataFeedLatestAnswer();

        // Chainlink returns prices with 8 decimals for BTC/USD
        expect(price).to.be.greaterThan(0);

        console.log("Raw price (with 8 decimals):", price.toString());
        console.log("Formatted price:", formatPrice(price, 8));
    });


    it("Should demonstrate price feed metadata", async function () {
        const dataFeedAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
        const dataFeed = await ethers.getContractAt(
            aggregatorV3InterfaceABI,
            dataFeedAddress
        );

        const decimalsDF = await dataFeed.decimals();
        const descriptionDF = await dataFeed.description();
        const versionDF = await dataFeed.version();
        const [decimalsDC, descriptionDC, versionDC] =
            await dataConsumer.getFeedMetadata();

        expect(decimalsDC).to.be.equal(decimalsDF);
        expect(descriptionDC).to.be.equal(descriptionDF);
        expect(versionDC).to.be.equal(versionDF);

        console.log("\n=== Chainlink Feed Metadata ===");
        console.log("decimals:", decimalsDF);
        console.log("version:", versionDF);
        console.log("description:", descriptionDF);
    });

    it("Should get full round data", async function () {
        const [roundId, answer, startedAt, updatedAt, answeredInRound] =
            await dataConsumer.getLatestRoundData();

        console.log("\n=== Latest Round Data ===");
        console.log("Round ID:", roundId.toString());
        console.log("Answer:", formatPrice(answer, 8));
        console.log("Started At:", new Date(Number(startedAt) * 1000).toISOString());
        console.log("Updated At:", new Date(Number(updatedAt) * 1000).toISOString());
        console.log("Answered In Round:", answeredInRound.toString());

        // Verify data freshness (updated within last hour)
        const currentTime = Math.floor(Date.now() / 1000);
        const dataAge = currentTime - Number(updatedAt);
        expect(dataAge).to.be.lessThan(3600); // Less than 1 hour old
    });

    it("Should compare prices over multiple calls", async function () {
        const price1 = await dataConsumer.getChainlinkDataFeedLatestAnswer();

        // Wait for a price change
        await new Promise(resolve => setTimeout(resolve, 100));

        const price2 = await dataConsumer.getChainlinkDataFeedLatestAnswer();

        console.log("\n=== Price Comparison ===");
        console.log("First call:", formatPrice(price1, 8));
        console.log("Second call:", formatPrice(price2, 8));
    });
});


function formatPrice(price: bigint, decimals: number, showSign: boolean = false): string {
    const divisor = 10n ** BigInt(decimals);
    const integerPart = price / divisor;
    const fractionalPart = price % divisor;

    const priceNumber = Number(integerPart) + Number(fractionalPart) / Number(divisor);

    const sign = showSign ? (priceNumber >= 0 ? '+' : '') : '';

    return sign + '$' + priceNumber.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
