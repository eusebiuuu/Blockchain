# Activity 6: ERC-20 Tokens.

## Solidity/Ethereum basics

### EIP- Ethereum Improvement Proposals and Ethereum Request for Comments

Ethereum Improvement Proposals (EIPs) describe standards for the Ethereum platform, including core protocol specifications, client APIs, and contract standards. It includes ERC (Ethereum Request for Comments) for Application-level standards and conventions, including contract standards such as token standards.

### ERC-20 token. 
The ERC-20 standard defines digital assets like currencies and loyalty points. These tokens can be easily exchanged using smart contracts and are simple to deploy. Widely supported by cryptocurrency wallets, ERC-20 is also compatible with most Ethereum-based contracts.

### ERC-20 Token specification.
Token creator must define fields: 

-   **Token name**: The name of the token is a unique identifier, providing a recognizable label for users and platforms. It helps distinguish the token in wallets, exchanges, and across applications. For example, “USD Coin” or “Chainlink.” 
-   **Token symbol**: The symbol is a shorthand identifier, usually consisting of three to five uppercase letters, similar to stock ticker symbols. It’s used for quick identification on exchanges and wallets. Examples include “USDC” for USD Coin or “LINK” for Chainlink.
-   **Number of Tokens created**: This defines the total supply of tokens that exist or can ever exist. Some tokens have a fixed supply (like 1 billion tokens), while others might have mechanisms to mint or burn tokens over time. This initial supply affects scarcity and, potentially, the token's value., 
-   **Subdivisions**:  Most tokens are divisible, allowing users to transact in smaller amounts. Subdivisions set how many decimal places a token can be split into, similar to how a dollar can be divided into cents. In ERC-20 tokens, subdivisions are commonly set to 18 decimal places, enabling fine-grained transactions (e.g., 0.000000000000000001 of a token). 


### Methods.
ERC – 20 standard defines methods:

-   **balanceOf**: Used to check the token balance of a given address. Returns the number of tokens held by the specified account.

```js
function balanceOf(address _owner) public view returns (uint256 balance)
```

-   **totalSupply**: Returns the total supply of tokens that exist within the contract available across all accounts.

```js
function totalSupply() public view returns (uint256)
```

-   **transfer**: Transfers tokens from the caller’s account to another account. Returns a boolean indicating success (true if the transfer was successful).

```js
function transfer(address _to, uint256 _value) public returns (bool success)
```

-   **approve**: Allows a spender to withdraw a specific number of tokens from the caller’s account, i.e. sets an allowance for the spender to use transferFrom up to the approved amount.
Returns a boolean indicating success (true if the approval was successful).

```js
function approve(address _spender, uint256 _value) public returns (bool success)
```

-   **allowance**: Checks the remaining number of tokens that a spender is allowed to withdraw from the owner’s account. Returns the remaining approved token amount that the spender can withdraw from the owner's account.

```js
function allowance(address _owner, address _spender) public view returns (uint256 remaining)
```

-   **transferFrom**: Transfers tokens from one account to another on behalf of the owner. Returns A boolean indicating success (true if the transfer was successful) Requires prior approval from the from account to allow the caller to execute this transfer.

```js
function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
```



### Events.
ERC – 20 standard defines events:

-   **Transfer**: Triggered when tokens are transferred from one account to another.

```js
event Transfer(address indexed _from, address indexed _to, uint256 _value)
```

-   **Approval**: Triggered when an account approves a spender for a specific amount.

```js
event Approval(address indexed _owner, address indexed _spender, uint256 _value)
```


### Members of address:

- **balance**: account balance.
- **code**: code for smart contract account.
- **send**: send given amount of Wei to Address, returns false on failure, forwards 2300 gas.
- **transfer**: send given amount of Wei to Address, reverts on failure forwards 2300 gas.
- **call**(bytes memory): low-level CALL with the given payload, returns success condition and return data, forwards all available gas.
- **delegatecall**(bytes memory): low-level DELEGATE CALL wiht a given payload, returns success condition and return data; it runs in the caller context
- **staticcall** for read-only calls.


### Special functions

There are two special functions associated with eth transfers receive() and fallback(). Both are marked public payable. Each contract has its own balance and may receive eth in the following ways:
- **constructor payable**: If the constructor of a contract is payable, when the contract is deployed the msg.value of the transaction calling the constructor will be deposited in the contract balance.

- **function payable**: If a function is payable, when the function is called with msg.value, msg.value will be added to the contract balance.

- **receive function**: each contract may have one receive function. This function is executed after a call to the contract with empty calldata. If the contract has no payable function defined it must have a receive function in order to receive eth.

- **fallback function**: each contract may have one fallback function. This function is executed after a call to the contract if none of the other function match the call or if calldata is empty and there is not receive function. If the contract has no payable function defined or no receive function it must have a fallback function in order to receive eth. It is recommended to define a receive function even if a fallback function is defined to distinguish between transfers and other types of calls.


### Inheritance
Solidity supports multiple inheritance, polymorphism and overriding. Keywords this and super have the standard semantics: current contract, the parent of the current contract in the inheritance hierarchy. Keywords virtual and override are also used with the standard meaning: functions not yet implemented and functions the override the implementation from the base class.
“When a contract inherits from other contracts, only a single contract is created on the blockchain, and the code from all the base contracts is compiled into the created contract.”


## Exercises

1.	**Deploy and test an ERC20 token implementation**: 

a. Configure an Infura API Key as in [3] and add it in .env file.

b. Check the networks configuration in hardhat.config.js:

c. Run a local hardhat node and deploy the contract MyERC20 on the local network and on Sepolia:

```
npx hardhat ignition deploy ./ignition/modules/MyERC20.ts

npx hardhat node

npx hardhat ignition deploy ./ignition/modules/MyERC20.ts --network localhost

npx hardhat ignition deploy ./ignition/modules/MyERC20.ts --network sepolia
```


2.	**Test Hardhat projects**: 

a. Run test in test/MyERC20.js

```
npx hardhat test ./test/MyERC20.ts
```

b. Write test for the contract MyOZERC20

3. **NFT Auction**

Implement a complete NFT auction system that allows users to auction their PhotoNFTs. The system consists of:

- PhotoNft - An ERC721 NFT contract (already provided)
- SecureAuction - An auction contract for a single NFT (modify the provided template)
- AuctionFactory - A factory contract to create and manage multiple auctions

You should:
- Implement access control with OpenZeppelin's Ownable
- Add emergency controls with Pausable
- Practice the withdrawal pattern for secure fund management


### Docs: 
[1] https://ethereum.org/en/developers/docs/standards/tokens/erc-20/

[2] https://docs.metamask.io/services/get-started/infura

[3] https://hardhat.org/tutorial/testing-contracts
