# Activity 8: Oracles:

**Objectives**
- Integrate Chainlink data-feed consumers.
- Integrate Chainlink RNG with VRFs


Chainlink VRF provides cryptographically secure and verifiable random numbers for smart contracts. Unlike traditional RNG, Chainlink VRF generates randomness off-chain and provides cryptographic proof on-chain that the random number was generated correctly and hasn't been tampered with.

**Vulnerabilities:** when using block data to generate randomness:
1. **Miner Manipulation**: Miners can choose not to publish blocks with unfavorable randomness
2. **Predictable**: Block data is publicly visible before transactions execute
3. **Front-running**: Attackers can see the "random" value and act accordingly
4. **MEV Exploitation**: Bots can extract value by predicting outcomes


## Chainlink VRF Architecture

```
┌─────────────────┐
│  Smart Contract │
│   (Consumer)    │
└─────────────────┘
│ 1. Request Random Number
│    (pays LINK fee)
▼
┌─────────────────┐
│ VRF Coordinator │ ◄── Chainlink contract on-chain
└─────────────────┘
│ 2. Emit Event
│    RandomnessRequest
▼
┌─────────────────┐
│  Chainlink Node │ ◄── Off-chain oracle
│   (VRF Oracle)  │
└─────────────────┘
│ 3. Generate Random Number
│    + Cryptographic Proof
▼
┌────────────────────┐
│ VRF Coordinator    │
│  Verifies Proof    │
└────────────────────┘
│ 4. Callback with
│    Verified Random Number
▼
┌────────────────────┐
│  Smart Contract    │
│ fulfillRandomness()│
└────────────────────┘
```

### 1. **VRF Coordinator Contract**

The central on-chain contract that:

- Receives randomness requests from consumer contracts
- Emits events for Chainlink nodes
- Verifies cryptographic proofs
- Delivers verified random numbers to consumers
- Manages LINK payments and subscriptions


### 2. **Chainlink VRF Node (Off-Chain)**

The oracle that:
- Listens for `RandomnessRequest` events
- Uses a secret key to generate randomness
- Creates cryptographic proof (VRF proof)
- Submits proof + random number back on-chain

**Key Properties:**
- Has a **public key** (keyHash) and **private key**
- Private key never leaves the node
- Proof mathematically guarantees the random number was generated using that private key

### 3. **Consumer Contract (on-chain Smart Contract)**

Smart contract that:
- Requests randomness by calling VRF Coordinator
- Implements callback function to receive randomness
- Pays LINK tokens for the service

## Usage

- Add the RPC URL and the private key in .env.
- npx hardhat keystore set SEPOLIA_RPC_URL --dev

- Create [subscription](https://vrf.chain.link/) on VRF Coordinator 
- Fund subscription with LINK
- Add your consumer contracts to subscription
- Contracts can request randomness (paid from subscription)

```
npx hardhat ignition deploy ./ignition/modules/PriceFeed.ts --network sepolia

npx hardhat test --network sepolia
```

### Exercise

Develop an on-chain game based on Oracle RNGs.

## References

1. [Chainlink getting started](https://docs.chain.link/vrf/v2/getting-started)
2. [QuickNode guide](https://www.quicknode.com/guides/ethereum-development/smart-contracts/how-to-use-chainlink-vrf-in-your-smart-contract)
3. [Chainlink VFR](https://docs.chain.link/vrf)
4. [Chainlink Oracles](https://chain.link/education-hub/blockchain-vs-oracles)
5. [Chainlink VFR](https://docs.chain.link/vrf/v2-5/migration-from-v2)




