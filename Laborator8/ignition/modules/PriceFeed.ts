import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DataConsumerV3", (m) => {

    const dataFeedAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
    const priceFeed = m.contract("DataConsumerV3",[dataFeedAddress]);

    return { priceFeed };
});
