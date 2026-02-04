// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

// Unfinished

/*
## IOC.
An Initial Coin Offer is a fundraising model that involves 
exchanging digital currencies for new issued coins or tokens, 
most commonly for ERC20 tokens or other types of tokens. 
Investors are informed about the project’s purposes 
in a white paper. If they decide to participate 
in the fundraising, they are rewarded with tokens or coins 
that they may further use as planned by the project initiators.

Create an ICO with the following specifications:

- Investors will receive a number of tokens in exchange 
for ethers (wei) at a specified price. The type of tokens is a newly created ERC20 token.

- Each unit of ERC20 token has a price. 
An investor can deposit the amount of ether (wei) equivalent to the desired number of tokens.

- The fundraising has the following parameters: startDate, endDate, owner, unitPrice and minTokens. 
The owner is the person that manages the event. minTokens represent the minimum number of tokens required by investors for the new ERC20 token to be emitted.

- If, between startDate and endDate, investors deposit 
an amount of wei enough to cover minToken, 
the owner deploys the ERC20 token and distributes tokens to the investors.

- If, between startDate and endDate, 
the funds deposited by investors are insufficient to reach minTokens, the owner refunds the sums to the respective investors.

Required functions:
- initialize() - Constructor replacement for proxy pattern, set owner, startDate, endDate, unitPrice, minTokens
- invest() - Allow investors to deposit ETH, calculate number of tokens investor will receive.
- finalizeICO() - Called by owner after endDate
- refund() - Withdrawal pattern for failed ICO.

Required events:
```solidity
event InvestmentReceived(address indexed investor, uint256 amount, uint256 tokens);
event ICOFinalized(bool successful, uint256 totalRaised);
event TokensDistributed(address indexed investor, uint256 amount);
event RefundClaimed(address indexed investor, uint256 amount);
```

Upgraded implementation ideas:
- Bonus tokens for early investors (first 24 hours)
- Referral system (bonus for referring new investors)

*/
contract ICO {
    uint256 public startDate;
    uint256 public endDate;
    address public owner;
    uint256 public unitPrice;
    uint256 public minTokens;

    constructor(uint256 start, uint256 end, uint price, uint tokensLimit) {
        startDate = start;
        endDate = end;
        owner = msg.sender;
        unitPrice = price;
        minTokens = tokensLimit;
    }
}
