## Ethereum Account-Based Model

### Account-Based Model vs UTXO

Unlike Bitcoin's UTXO model, Ethereum uses an **account-based model** similar to traditional banking:

- **Accounts have balances**: Each address has a single balance (state)
- **Direct transfers**: Send value directly from one account to another
- **Stateful**: Full account state (balance, nonce, code, storage) must be maintained
- **No "change" outputs**: Transfer exact amounts without creating change UTXOs

### Ethereum Types of Accounts

1. **Externally Owned Accounts (EOA)**:
    - Controlled by private keys (like Bitcoin addresses)
    - Can initiate transactions
    - No associated code
    - Balance in ETH

2. **Contract Accounts**:
    - Controlled by smart contract code
    - Cannot initiate transactions (must be triggered by EOA)
    - Store code and state
    - Balance in ETH


### Ethereum Transaction Fields

A standard Ethereum transaction contains the following fields:

#### 1. **Nonce** (`uint64`)
- **Purpose**: Transaction sequence number for the sender's account
- **Value**: Starts at 0, increments by 1 for each transaction
- **Function**: Prevents replay attacks and ensures transaction ordering
- **Important**: Transactions must be processed in nonce order

**Example:**
```
Account sends 3 transactions:
  Tx1: nonce = 5
  Tx2: nonce = 6
  Tx3: nonce = 7
```
If Tx2 is missing, Tx3 cannot be processed until Tx2 arrives.

---

#### 2. **Gas Price** (`uint256`) [Legacy] or **Max Fee Per Gas** (EIP-1559)

**Pre-EIP-1559 (Legacy Transactions):**
- `gasPrice`: Amount of wei willing to pay per unit of gas
- Simple auction model: higher gas price = faster inclusion
- All gas is paid at this price

**Post-EIP-1559 (Type 2 Transactions):**
- `maxPriorityFeePerGas`: "Tip" to miners (priority fee)
- `maxFeePerGas`: Maximum total fee willing to pay per gas
- `baseFeePerGas`: Protocol-determined base fee (burned)

$$\text{Effective Gas Price} = \min(\text{maxFeePerGas}, \text{baseFeePerGas} + \text{maxPriorityFeePerGas})$$

$$\text{Actual Fee} = \text{Effective Gas Price} \times \text{Gas Used}$$

---

#### 3. **Gas Limit** (`uint64`)
- **Purpose**: Maximum gas willing to consume for this transaction
- **Protection**: Prevents infinite loops/expensive operations from draining account
- **Refund**: Unused gas is refunded to sender
- **Failure**: If gas limit too low, transaction fails but gas is still consumed

**Standard Gas Limits:**
```
Simple ETH transfer:        21,000 gas
ERC-20 transfer:           ~65,000 gas
Complex smart contract:    100,000+ gas
```

**Gas Calculation:**
```
Total Fee Paid = min(Gas Limit, Gas Actually Used) × Gas Price
Refund = (Gas Limit - Gas Used) × Gas Price
```

---

#### 4. **To** (`address`, 20 bytes)
- **Recipient address**: Can be EOA or contract
- **Special case**: Empty/null address (`0x0`) for contract creation
- **Format**: 0x followed by 40 hexadecimal characters (20 bytes)

**Examples:**
```
EOA address:      0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Contract address: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC)
Contract creation: 0x0000000000000000000000000000000000000000 (or empty)
```

---

#### 5. **Value** (`uint256`)
- **Amount**: ETH to transfer (in wei, where 1 ETH = 10¹⁸ wei)
- **Can be zero**: For pure contract interactions without ETH transfer
- **Payable functions**: Contract must have `payable` modifier to receive ETH

**Wei Denominations:**
```
1 wei       = 1
1 gwei      = 10⁹ wei  (common for gas prices)
1 ether     = 10¹⁸ wei
```

---

#### 6. **Data** (`bytes`)
- **Purpose**: Arbitrary data payload
- **Uses**:
    - **Contract creation**: Contains contract bytecode
    - **Contract interaction**: Contains encoded function call (ABI encoded)
    - **Simple transfer**: Empty (0 bytes)
    - **Arbitrary data**: Can include messages, NFT metadata, etc.

**Function Call Encoding (ABI):**
```
data = function_selector(4 bytes) + encoded_parameters

Example (ERC-20 transfer):
Function: transfer(address to, uint256 amount)
Selector: 0xa9059cbb (first 4 bytes of keccak256("transfer(address,uint256)"))
Data: 0xa9059cbb
      000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb  (recipient)
      0000000000000000000000000000000000000000000000000de0b6b3a7640000  (amount: 1 ETH)
```

---

#### 7. **v, r, s** (Signature Components)

For more information on what do these values mean, check [these docs](./mathematical_foundations.md).

**ECDSA Signature over secp256k1:**

The transaction is signed by the sender's private key, producing three values:

- **r** (`uint256`, 32 bytes): X-coordinate of ephemeral public key point
- **s** (`uint256`, 32 bytes): Signature proof value
- **v** (`uint8`, 1 byte): Recovery identifier + chain ID encoding

**Recovery ID (v):**

Pre-EIP-155:
```
v ∈ {27, 28}
```

Post-EIP-155 (Replay Protection):
```
v = chainID × 2 + 35 + {0, 1}

Examples:
Ethereum Mainnet (chainID = 1): v ∈ {37, 38}
Sepolia Testnet (chainID = 11155111): v ∈ {22310257, 22310258}
```

**Public Key Recovery:**

Unlike Bitcoin, Ethereum derives addresses from public keys, and `v` allows recovering the public key from the signature:

$$\text{Public Key} = \text{Recover}(r, s, v, \text{message hash})$$

$$\text{Address} = \text{Keccak256}(\text{Public Key})[-20:]$$

This is why Ethereum doesn't store public keys on-chain explicitly.

---


### **Transaction Receipts**
After execution, a receipt is generated containing:
- **Status**: Success (1) or failure (0)
- **Gas Used**: Actual gas consumed
- **Logs**: Events emitted by smart contracts
- **Cumulative Gas Used**: Total gas in block up to this transaction
- **Bloom Filter**: For efficient log searching

---

### Gas Fees Calculation (EIP-1559)

**Base Fee:**
- Dynamically adjusted based on network congestion
- Target: 50% full blocks
- If block > 50% full → base fee increases
- If block < 50% full → base fee decreases
- **Burned** (removed from circulation)

**Priority Fee (Tip):**
- Set by user to incentivize validators
- Goes directly to validator/miner
- Optional but recommended for faster inclusion

**Example Calculation:**
```
Base Fee:             25 gwei
Priority Fee:          2 gwei
Max Fee Per Gas:      50 gwei

Effective Gas Price = min(50, 25 + 2) = 27 gwei

Transaction uses 21,000 gas:
  Total Fee = 27 gwei × 21,000 = 567,000 gwei = 0.000567 ETH
  
  Breakdown:
    - Burned: 25 gwei × 21,000 = 525,000 gwei
    - To Validator: 2 gwei × 21,000 = 42,000 gwei
```

---

---

## Key Differences: Bitcoin vs Ethereum Transactions

| Feature | Bitcoin (UTXO) | Ethereum (Account) |
|---------|----------------|-------------------|
| **Model** | UTXO-based | Account-based |
| **Balance** | Sum of UTXOs | Single account balance |
| **Inputs/Outputs** | Multiple inputs/outputs | Single sender/receiver |
| **Transaction Size** | Variable (depends on UTXOs) | More predictable |
| **Change** | Explicit change output | Automatic balance update |
| **Fees** | Implicit (input - output) | Explicit (gas × gasPrice) |
| **Smart Contracts** | Limited (Bitcoin Script) | Turing-complete (EVM) |
| **Nonce** | None (UTXO uniqueness) | Required (transaction ordering) |
| **Replay Protection** | Different UTXO sets | Chain ID in signature |
| **Public Key** | In scriptSig (input) | Recovered from signature |
| **Data Field** | OP_RETURN (limited) | Arbitrary data |

---

## Transaction Fields vs Transaction Metadata

### Fields in the Signed Transaction (User Creates)

These are the fields the user signs and broadcasts:
```javascript
{
  // Core transaction fields (user provides)
  nonce: 5,
  maxFeePerGas: 50000000000,
  maxPriorityFeePerGas: 2000000000,
  gasLimit: 21000,
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: 1000000000000000000,
  data: "0x",
  chainId: 1,  // ⚠️ Special case: included in signature for replay protection
  
  // Signature (generated from private key)
  v: 37,
  r: "0x...",
  s: "0x..."
}
```

### Metadata Added After Block Inclusion (Network Provides)

Once a transaction is **mined and included in a block**, the blockchain adds additional metadata:
```javascript
{
  // ... all fields above, plus:
  
  // Block metadata (added by blockchain)
  blockHash: "0x1234...",        // Hash of the block containing this transaction
  blockNumber: 17500000,         // Block height/number
  transactionIndex: 42,          // Position within the block (0-indexed)
  
  // Additional metadata
  from: "0xSender...",           // Derived from signature (not in raw tx)
  hash: "0xabcd...",             // Transaction hash (keccak256 of signed tx)
  
  // Post-execution metadata (from receipt)
  status: 1,                     // 1 = success, 0 = failure
  gasUsed: 21000,                // Actual gas consumed
  effectiveGasPrice: 27000000000, // Actual gas price paid
  cumulativeGasUsed: 5250000,    // Total gas used in block up to this tx
  logs: [],                      // Events emitted
  logsBloom: "0x...",            // Bloom filter for logs
  contractAddress: null          // If contract creation, the new contract address
}
```

---

### Metadata Fields

### 1. **chainId** (Hybrid: In Transaction AND Used for Metadata)

**In the Transaction:**
- **Purpose**: Prevents replay attacks across different Ethereum chains
- **Included in signature** (EIP-155)
- **User specifies** when creating transaction
- **Immutable**: Part of the signed data

**Usage:**
```javascript
// Mainnet
chainId: 1

// Common testnets
chainId: 11155111  // Sepolia
chainId: 5         // Goerli (deprecated)

// Layer 2s
chainId: 10        // Optimism
chainId: 137       // Polygon
chainId: 42161     // Arbitrum One
```

**Why It Matters:**

Without chainId in the signature, an attacker could take a transaction from Ethereum mainnet and replay it on a testnet or another chain:

**Example Attack (Pre-EIP-155):**
```
1. Alice sends 10 ETH on Ethereum Mainnet
2. Attacker copies the signed transaction
3. Attacker broadcasts same transaction on Ethereum Classic
4. Alice loses 10 ETC without intending to send it
```

**EIP-155 Solution:**

The signature now includes chainId:

$$v = \text{chainId} \times 2 + 35 + \{0, 1\}$$

**For Ethereum Mainnet (chainId = 1):**
```
v = 1 × 2 + 35 + {0, 1} = {37, 38}
```

**Recovery of chainId from v:**
```python
if v >= 37:  # EIP-155 signature
    chainId = (v - 35) // 2
else:  # Pre-EIP-155 signature
    chainId = None  # Vulnerable to replay
```

**Message Signing (Post-EIP-155):**
```
Message = keccak256(RLP([
    nonce, 
    gasPrice, 
    gasLimit, 
    to, 
    value, 
    data, 
    chainId,  // ← Included here!
    0,        // ← Placeholder for r
    0         // ← Placeholder for s
]))
```

---

### 2. **blockHash** (Added After Mining)

- **Type**: `bytes32` (32 bytes / 64 hex characters)
- **Value**: Keccak-256 hash of the block header containing this transaction
- **When Added**: After transaction is included in a block
- **Purpose**:
    - Links transaction to specific block
    - Enables verification of transaction inclusion
    - Used in light clients for SPV (Simplified Payment Verification)

**Block Hash Calculation:**
```
blockHash = keccak256(RLP([
    parentHash,
    unclesHash,
    miner,
    stateRoot,
    transactionsRoot,  // Merkle root of all transactions
    receiptsRoot,
    logsBloom,
    difficulty,
    number,
    gasLimit,
    gasUsed,
    timestamp,
    extraData,
    mixHash,
    nonce
]))
```

**Example:**
```javascript
blockHash: "0x1a2b3c4d5e6f..."  // 32 bytes
```

**Usage:**

1. **Verify Transaction Inclusion:**
```python
# Check if transaction is in claimed block
def verify_transaction_in_block(tx_hash, block_hash, merkle_proof):
    """Verify transaction without downloading full block"""
    # Use Merkle proof to verify tx_hash is in transactionsRoot
    # transactionsRoot is part of block header (block_hash)
    return verify_merkle_proof(tx_hash, block_hash, merkle_proof)
```

2. **Reorg Detection:**
```javascript
// Transaction was in block A
originalBlockHash = "0xaaa..."

// After reorg, same transaction might be in block B
newBlockHash = "0xbbb..."

if (tx.blockHash !== originalBlockHash) {
    console.log("Chain reorganization detected!");
}
```

3. **Light Client Verification:**
```
Light client only downloads block headers (not full blocks)
→ Has blockHash
→ Can verify transaction inclusion via Merkle proof
→ Doesn't need full block data
```

---

### 3. **blockNumber** (Added After Mining)

- **Type**: `uint256` (but practically < 2^64)
- **Value**: Sequential block height/number in the blockchain
- **When Added**: After transaction is included in a block
- **Genesis Block**: Block number 0
- **Current**: ~19 million+ (as of 2024)

**Purpose:**
- Determine transaction age
- Calculate confirmations
- Query transactions by block range
- Time-based logic in smart contracts

**Example:**
```javascript
blockNumber: 17500000
```

**Usage Patterns:**

1. **Confirmation Counting:**
```javascript
const confirmations = currentBlockNumber - tx.blockNumber;

if (confirmations >= 12) {
    console.log("Transaction is considered final");
}
```

2. **Block Range Queries:**
```javascript
// Get all transactions from blocks 17,000,000 to 17,500,000
const transactions = await getTransactionsInRange(17000000, 17500000);
```

3. **Smart Contract Time Logic:**
```solidity
// Smart contract using block number for timing
contract TimeLock {
    uint256 public unlockBlock;
    
    constructor() {
        unlockBlock = block.number + 100;  // Unlock after 100 blocks (~20 min)
    }
    
    function withdraw() public {
        require(block.number >= unlockBlock, "Still locked");
        // ... withdraw logic
    }
}
```

4. **Timestamp Approximation:**
```javascript
// Ethereum block time ≈ 12 seconds
const blockTime = 12; // seconds
const txAge = (currentBlockNumber - tx.blockNumber) * blockTime;
console.log(`Transaction age: ~${txAge} seconds`);
```

**Special Cases:**

- **Pending Transactions**: `blockNumber: null` (not yet mined)
- **After Reorg**: Block number might change if transaction is included in different block

---

### 4. **transactionIndex** (Added After Mining)

- **Type**: `uint256` (but typically small, < 1000)
- **Value**: Zero-indexed position of transaction within the block
- **When Added**: After block is mined
- **Range**: 0 to (number of transactions in block - 1)

**Purpose:**
- Unique identification within a block
- Deterministic transaction ordering
- Receipt Merkle proof construction
- Gas accounting (cumulative gas used)

**Example:**
```javascript
{
    blockNumber: 17500000,
    blockHash: "0x1a2b...",
    transactionIndex: 42,  // 43rd transaction in the block (0-indexed)
    
    // This means:
    // - 42 transactions were executed before this one in the block
    // - Transaction ordering affects state changes
    // - Gas was consumed by previous 42 transactions
}
```

**Transaction Ordering in Blocks:**
```
Block #17500000
├─ Transaction 0 (transactionIndex: 0)   ← First transaction
├─ Transaction 1 (transactionIndex: 1)
├─ Transaction 2 (transactionIndex: 2)
│  ...
├─ Transaction 42 (transactionIndex: 42) ← Our transaction
│  ...
└─ Transaction 173 (transactionIndex: 173) ← Last transaction
```

**Why Order Matters:**

1. **State Dependence:**
```javascript
// Both transactions interact with same contract
// Tx Index 5: Alice deposits 100 USDC
// Tx Index 6: Bob tries to withdraw all USDC

// Execution order determines outcome:
// If Tx 5 executes first → Tx 6 succeeds
// If Tx 6 executes first → Tx 6 fails (insufficient balance)
```

2. **Nonce Ordering:**
```javascript
// Same account sends multiple transactions in one block
Account: 0xAlice
├─ transactionIndex: 10, nonce: 5
├─ transactionIndex: 45, nonce: 6
└─ transactionIndex: 89, nonce: 7

// Must execute in nonce order, not transactionIndex order
// Miner can arrange them, but nonce must be sequential
```

3. **Cumulative Gas:**
```javascript
{
    transactionIndex: 42,
    gasUsed: 21000,              // Gas used by THIS transaction
    cumulativeGasUsed: 5250000   // Gas used by ALL transactions 0-42
}

// Gas used by previous 42 transactions = 5,250,000 - 21,000 = 5,229,000
```

**MEV (Maximal Extractable Value) and Transaction Ordering:**

Miners/validators can reorder transactions within a block to maximize profit:
```javascript
// Profitable ordering for miner:
Block {
    transactionIndex: 0  → Frontrun: Buy token X
    transactionIndex: 1  → Victim: Large buy order for token X (price increases)
    transactionIndex: 2  → Backrun: Sell token X at profit
}
```


## Summary: Transaction Fields and Metadata

| Field | In Signed Transaction? | When Added | Mutable? |
|-------|----------------------|------------|----------|
| **nonce** | ✅ Yes | User creates | ❌ No |
| **gasPrice / maxFeePerGas** | ✅ Yes | User creates | ❌ No |
| **gasLimit** | ✅ Yes | User creates | ❌ No |
| **to** | ✅ Yes | User creates | ❌ No |
| **value** | ✅ Yes | User creates | ❌ No |
| **data** | ✅ Yes | User creates | ❌ No |
| **chainId** | ✅ Yes | User creates | ❌ No |
| **v, r, s** | ✅ Yes | Signing process | ❌ No |
| **from** | ❌ No (derived) | Signature recovery | ❌ No |
| **hash** | ❌ No (derived) | After signing | ❌ No |
| **blockHash** | ❌ No | After mining | ⚠️ Yes (reorgs) |
| **blockNumber** | ❌ No | After mining | ⚠️ Yes (reorgs) |
| **transactionIndex** | ❌ No | After mining | ⚠️ Yes (reorgs) |
| **status** | ❌ No | After execution | ❌ No |
| **gasUsed** | ❌ No | After execution | ❌ No |


## Exercises

### Implementing Blockchain Voting Systems.

An online voting system should allow a transparent and secure vote counting. The permission to vote should be granted to the rightful persons. Participants should not be manipulated during the voting period. The results should be accessible only when the voting period is over.

1.	Work on file `Voting.sol`. Test at [RemixIDE](https://remix.ethereum.org/)

- Add variable `endVoting`. Initialize this variable in the constructor using `block.timestamp`. Use require to revert the method vote if the block timestamp is greater than endVoting.

- Add variables or functions needed in order to verify that each registerToken is used only once.

- Add variables or functions needed in order to verify that an address can only vote once.

- Complete the definition of function `winningProposal`. Voting period should be finished and the proposal with the most votes wins.

2.	**Delegated Votes**: Modify the code to enable each token owner to delegate it’s vote to another address after registration. Modify the vote method so that only one of the voter or its delegator can vote.

3.	**Team members**: Modify the code to enable the registration and retrieval of team members names for each proposal.

4. **Tests**:
-   Add proposals.
-   Get the details about proposals.
-   Try the get details about proposals stored in the array proposals using an invalid index.
-   Register an address as voter.
-   Vote a proposal and check the status of storage variables.



### Implementing Blockchain Auction Systems

Implement two different auction mechanisms as smart contracts:
1. **English Auction** (Ascending Price): Bidders compete by offering increasingly higher bids

An **English Auction** is the traditional auction format where:
- Auction starts with a reserve price (minimum bid)
- Bidders must bid higher than the current highest bid
- Each new bid must exceed the previous by a minimum increment
- Auction runs for a fixed duration
- Highest bidder at the end wins
- Previous bidders get their ETH refunded


2. **Dutch Auction** (Descending Price): Price starts high and decreases until someone accepts

A **Dutch Auction** is a reverse auction where:
- Price starts high and decreases over time
- First bidder to accept the current price wins
- No competitive bidding - first acceptance wins
- Price decreases linearly or exponentially
- Auction ends immediately when someone bids


### Docs: 

https://docs.soliditylang.org/en/v0.8.24/

https://docs.soliditylang.org/_/downloads/en/latest/pdf/

https://web3-type-converter.onbrn.com/