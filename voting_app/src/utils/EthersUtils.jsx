import deployedAddresses from "../contracts/addresses.json";
import VotingArtifact from "../contracts/Voting.json";

const VOTING_ADDRESS = deployedAddresses.voting;
const VOTING_ABI = VotingArtifact.abi;

import {ethers} from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);

const connectWalletMetamask = (accountChangedHandler) => {
    if (window.ethereum) {
        provider.send("eth_requestAccounts", []).then(async () => {
            provider.getSigner().then(async (account) => {
                accountChangedHandler(account);
            });
        }).catch(async (error) => {
            console.error("Failed to connect wallet:", error);
        });
    } else {
        console.error("MetaMask not installed");
        alert("Please install MetaMask to use this application");
    }
}

const getAllProposals = async () => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);

        const proposals = await votingContract.getAllProposals();

        console.log(`Fetched ${proposals.length} proposals in 1 call`);

        return proposals.map((proposal, index) => ({
            id: index,
            projectName: ethers.decodeBytes32String(proposal.projectName),
            teamName: proposal.teamName,
            gitAddress: proposal.gitAddress,
            voteCount: Number(proposal.voteCount),
            state: Number(proposal.state)
        }));

    } catch (error) {
        console.error("Error fetching all proposals:", error);
        throw error;
    }
};

const getActiveProposals = async () => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);

        const [activeProposals, indices] = await votingContract.getActiveProposals();

        console.log(`Fetched ${activeProposals.length} active proposals in 1 call`);


        return activeProposals.map((proposal, arrayIndex) => ({
            id: Number(indices[arrayIndex]), // Original proposal index for voting
            name: ethers.decodeBytes32String(proposal.projectName),
            team: proposal.teamName,
            github: proposal.gitAddress,
            image: proposal.imageUrl,
            voteCount: Number(proposal.voteCount),
            state: Number(proposal.state)
        }));

    } catch (error) {
        console.error("Error fetching active proposals:", error);
        throw error;
    }
};

const registerVoter = async (signer, registerToken) => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);

        // Convert register token to bytes32
        const tokenBytes = ethers.encodeBytes32String(registerToken);


        const votingToken = await votingContract.registerVoter.staticCall(tokenBytes);

        const tx = await votingContract.registerVoter(tokenBytes);
        const receipt = await tx.wait();

        // The voting token is returned from the function
        console.log("Voter registered successfully");

        // Return both the voting token and receipt
        return {
            votingToken: votingToken,
            receipt: receipt
        };
    } catch (error) {
        console.error("Error registering voter:", error);
        throw error;
    }
};

const castVote = async (signer, proposalIds, signedToken) => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);

        const tx = await votingContract.vote(proposalIds, signedToken);
        const receipt = await tx.wait();

        console.log("Vote cast successfully");
        return receipt;
    } catch (error) {
        console.error("Error casting vote:", error);
        throw error;
    }
};

const hasVoted = async (address) => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);
        const voter = await votingContract.voters(address);

        return voter.voted;
    } catch (error) {
        console.error("Error checking vote status:", error);
        throw error;
    }
};

const registerProposal = async (signer, projectName, teamName, gitAddress, imageUrl, participant1, participant2) => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);

        // Convert project name to bytes32
        const projectNameBytes = ethers.encodeBytes32String(projectName);
        console.log("Project name:", projectNameBytes);

        const tx = await votingContract.registerProposal(
            projectNameBytes,
            teamName,
            gitAddress,
            imageUrl,
            participant1,
            participant2
        );

        console.log("tx", tx);
        const receipt = await tx.wait();

        console.log("Project registered successfully");
        return receipt;
    } catch (error) {
        console.error("Error registering proposal:", error);
        throw error;
    }
};

const getContractParams = async () => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);
        const [maxVotes, endRegister, endVoting] = await votingContract.getContractParams();

        return {
            maxVotes: Number(maxVotes),
            endRegister: Number(endRegister),
            endVoting: Number(endVoting),
            contractAddress: VOTING_ADDRESS
        };
    } catch (error) {
        console.error("Error fetching contract params:", error);
        throw error;
    }
};

const subscribeToVoteCastEvents = (onVoteCast) => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);

        // Event signature: VoteCast(address indexed voter, uint indexed proposalIndex)
        // Listen to VoteCast events
        const handleEvent = (...args) => {
            // The last argument is always the event object
            const event = args[args.length - 1];

            // For indexed parameters, ethers provides them as separate arguments
            // Args: [voter, proposalIndex, event]
            const voter = args[0];
            const proposalIndex = args[1];

            console.log('VoteCast event details:', {
                voter: voter,
                proposalIndex: Number(proposalIndex),
                blockNumber: event.log.blockNumber,
                transactionHash: event.log.transactionHash
            });

            // Call the callback with parsed data
            onVoteCast({
                voter: voter,
                proposalIndex: Number(proposalIndex),
                blockNumber: event.log.blockNumber,
                transactionHash: event.log.transactionHash
            });
        };

        votingContract.on("VoteCast", handleEvent);

        console.log("✓ Subscribed to VoteCast events");

        // Return cleanup function
        return () => {
            votingContract.off("VoteCast", handleEvent);
            console.log("Unsubscribed from VoteCast events");
        };

    } catch (error) {
        console.error("Error subscribing to VoteCast events:", error);
        throw error;
    }
};

const getVoteCastHistory = async (fromBlock = 0, toBlock = 'latest') => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);

        const eventFilter = votingContract.filters.VoteCast();
        const events = await votingContract.queryFilter(eventFilter, fromBlock, toBlock);

        return events.map(event => ({
            voter: event.args.voter,
            proposalIndex: Number(event.args.proposalIndex),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
        }));

    } catch (error) {
        console.error("Error fetching VoteCast history:", error);
        throw error;
    }
};

const setupMetaMaskListeners = (onAccountChanged, onNetworkChanged) => {
    if (!window.ethereum) {
        console.error("MetaMask not installed");
        return () => {};
    }

    // Handle account changes
    const handleAccountsChanged = (accounts) => {
        console.log('MetaMask account changed:', accounts);
        if (accounts.length === 0) {
            // User disconnected their wallet
            console.log('User disconnected wallet');
            onAccountChanged(null);
        } else {
            // Account changed
            console.log('Account switched to:', accounts[0]);
            onAccountChanged(accounts[0]);
        }
    };

    // Handle network/chain changes
    const handleChainChanged = (chainId) => {
        console.log('MetaMask network changed to:', chainId);
        onNetworkChanged(chainId);
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    console.log('✓ MetaMask event listeners setup');

    return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        console.log('✓ MetaMask event listeners removed');
    };
};

const getCurrentNetwork = async () => {
    try {
        const network = await provider.getNetwork();
        return {
            chainId: Number(network.chainId),
            name: network.name
        };
    } catch (error) {
        console.error("Error getting network:", error);
        throw error;
    }
};


const estimateVoteGas = async (signer, proposalIds, signedToken) => {
    try {
        const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);

        // Estimate gas for the vote transaction
        const gasEstimate = await votingContract.vote.estimateGas(proposalIds, signedToken);

        // Get current gas price
        const feeData = await signer.provider.getFeeData();

        // Calculate estimated cost
        const estimatedCost = gasEstimate * feeData.gasPrice;
        const estimatedCostInEth = ethers.formatEther(estimatedCost);

        console.log("Gas estimation successful");
        console.log("  Gas units:", gasEstimate.toString());
        console.log("  Estimated cost:", estimatedCostInEth, "ETH");

        return {
            success: true,
            gas: gasEstimate.toString(),
            gasPrice: feeData.gasPrice.toString(),
            costInWei: estimatedCost.toString(),
            costInEth: estimatedCostInEth
        };
    } catch (error) {
        console.error("Gas estimation failed:", error);

        let errorType = 'unknown';
        if (error.message.includes("Already voted")) {
            errorType = 'already_voted';
        } else if (error.message.includes("Invalid signature")) {
            errorType = 'invalid_signature';
        } else if (error.message.includes("Exceeded maximum votes")) {
            errorType = 'exceeded_max_votes';
        } else if (error.message.includes("Invalid proposal state")) {
            errorType = 'invalid_proposal_state';
        } else if (error.message.includes("voting is over")) {
            errorType = 'voting_over';
        } else if (error.message.includes("insufficient funds")) {
            errorType = 'insufficient_funds';
        }

        return {
            success: false,
            errorType: errorType,
            errorMessage: error.message,
            error: error
        };
    }
};

export {
    provider,
    connectWalletMetamask,
    getActiveProposals,
    getAllProposals,
    registerVoter,
    castVote,
    hasVoted,
    getContractParams,
    subscribeToVoteCastEvents,
    getVoteCastHistory,
    setupMetaMaskListeners,
    getCurrentNetwork,
    registerProposal,
    estimateVoteGas,
    VOTING_ADDRESS,
    VOTING_ABI
};