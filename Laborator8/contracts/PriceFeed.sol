// SPDX-License-Identifier: MIT
// https://docs.chain.link/data-feeds/getting-started
// https://docs.chain.link/data-feeds/price-feeds/addresses

pragma solidity ^0.8.28;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract DataConsumerV3 {
    AggregatorV3Interface internal dataFeed;

    /**
     * Network: Sepolia
     * Aggregator: BTC/USD
     * Address: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
     */
    constructor(address aggregator_address) {
        dataFeed = AggregatorV3Interface(aggregator_address);
    }

    /**
     * Returns the latest answer.
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int256) {
        // prettier-ignore
        (
        /* uint80 roundId */
            ,
            int256 answer,
        /*uint256 startedAt*/
            ,
        /*uint256 updatedAt*/
            ,
        /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function getPriceInCents() public view returns (uint256) {
        int256 price = getChainlinkDataFeedLatestAnswer();
        require(price > 0, "Invalid price");

        // Convert from 8 decimals to cents (2 decimals)
        // Divide by 10^6 to go from 8 decimals to 2 decimals
        return uint256(price) / 1e6;
    }

    function getLatestRoundData() public view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return dataFeed.latestRoundData();
    }

    function getFeedMetadata() public view returns (
        uint8 decimals,
        string memory description,
        uint256 version
    ) {
        decimals = dataFeed.decimals();
        description = dataFeed.description();
        version = dataFeed.version();
    }
}
