// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract PhotoNft is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor(string memory description, string memory symbol)
        ERC721(description, symbol)
        Ownable(msg.sender)
        {}

    function generateNft(string memory tokenURI, address newOwner) public returns (uint256) {
        uint256 newPhotoNftId = _tokenIdCounter;
        _mint(newOwner, newPhotoNftId);
        _setTokenURI(newPhotoNftId, tokenURI);

        transferOwnership(newOwner);

        _tokenIdCounter += 1;
        return newPhotoNftId;
    }
}