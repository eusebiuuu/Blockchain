// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "./PhotoNft.sol";
import "./Pausable.sol";

contract SecureAuction is Pausable {
    PhotoNft[] private items;
    mapping(address => uint256) public bids;
    mapping(address => uint256) public pendingReturns;
    address public highestBidder;
    uint256 public highestBid;
    bool public auctionEnded;

    uint currentBiddingIndex = 0;
    PhotoNft biddingItem;

    string name;

    event BidPlaced(address indexed bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);
    event Withdrawal(address indexed bidder, uint256 amount);
    event TokenInfo(uint256 tokenId);

    constructor(string memory auctionName) Pausable() {
        auctionEnded = false;
        name = auctionName;
    }

    function addItem(address nftAddress) external {
        items.push(PhotoNft(nftAddress));
    }

    function moveToNextBiddingItem() private whenNotPaused {
        currentBiddingIndex++;
        
        require(auctionEnded, "Auction for the current item is not ended");
        require(currentBiddingIndex <= items.length - 1, "No more items to bid on");

        biddingItem = items[currentBiddingIndex];
        auctionEnded = false;
        highestBid = 0;
        highestBidder = address(0);
    }

    function placeBid() external payable whenNotPaused {
        require(!auctionEnded, "Auction already ended");
        require(msg.value > 0, "Bid must be greater than 0");

        pause();
        bids[msg.sender] += msg.value;

        if (bids[msg.sender] > highestBid) {
            highestBidder = msg.sender;
            highestBid = bids[msg.sender];
        }

        emit BidPlaced(msg.sender, msg.value);
        unpause();
    }

    function endAuction() external whenNotPaused {
        require(!auctionEnded, "Auction already ended");
        require(highestBidder != address(0), "No bids placed");

        pause();

        auctionEnded = true;

        emit AuctionEnded(highestBidder, highestBid);
    }

    function withdraw() external {
        require(auctionEnded, "Auction not ended yet");
        require(msg.sender != highestBidder, "Winner cannot withdraw");

        uint256 refundAmount = bids[msg.sender];
        require(refundAmount > 0, "No funds to withdraw");

        bids[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(msg.sender, refundAmount);
    }

    function claimPrize(string memory tokenURI) external whenPaused returns (uint256) {
        require(auctionEnded, "Auction not ended yet");
        require(msg.sender == highestBidder, "Only winner can claim");
        require(highestBid > 0, "Already claimed");

        uint256 prizeAmount = highestBid;
        highestBid = 0; // Prevent re-entrancy

        (bool success, ) = msg.sender.call{value: prizeAmount}("");
        require(success, "Prize claim failed");

        uint256 newNFTId = biddingItem.generateNft(tokenURI, msg.sender);
        emit TokenInfo(newNFTId);
        
        unpause();
        
        return newNFTId;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}