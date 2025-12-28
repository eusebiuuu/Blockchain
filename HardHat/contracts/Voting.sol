// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;

contract Voting {

    enum State { Active, Inactive, Locked } 

    struct Voter {
        address voterAddress;
        bytes32 token;
        uint[] votes;
    }

    struct Proposal {
        string projectName;
        string teamName;
        uint voteCount;
        State state;
    }

    address public admin;

    uint endRegister;
    uint endVoting;
    uint nonce;
    uint maxVotes;

    mapping(address => Voter) public voters;
    mapping(bytes32 => address) public addresses;

    mapping(bytes32 => bool) usedRegisterToken;
    mapping(bytes32 => bool) usedVotingToken;

    Proposal[] public proposals;

    constructor(uint ndays, uint maxVotesCount) {
        admin = msg.sender;
        endRegister = block.timestamp + (ndays * 24 * 60 * 60);
        endVoting = block.timestamp + ((ndays + 10) * 24 * 60 * 60);
        maxVotes = maxVotesCount;
    }

    //---------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only an admin can call this function");
        _;
    }

    modifier validVotingPeriod(uint voteIdx) {
        require(proposals[voteIdx].state == State.Active && block.timestamp <= endVoting, "You cannot vote outside the established period");
        _;
    }

    modifier tooManyVotes(address voter) {
        require(voters[msg.sender].votes.length < maxVotes, "You've reached the maximum number of votes");
        _;
    }

    modifier checkTokenValidity(bytes32 token) {
        require(addresses[token] == msg.sender, "This token is not yours!");
        _;
    }

    //---------------------------------

    function registerProposal(string memory projectName, string memory teamName) external {
        proposals.push(Proposal({
            projectName: projectName,
            teamName: teamName,
            voteCount: 0,
            state: State.Inactive
        }));
    }

    function setProposalState(uint idx, State state) external onlyAdmin {
        proposals[idx].state = state;
    }

    function registerVoter(bytes32 registerToken) external returns (bytes32 votingToken) {
        require(usedRegisterToken[registerToken] == false, "You have already registered");
        usedRegisterToken[registerToken] = true;

        bytes32 randToken = keccak256(abi.encodePacked(nonce, registerToken, block.timestamp));
        voters[msg.sender].token = randToken;
        votingToken = keccak256(abi.encodePacked(randToken, msg.sender));

        voters[msg.sender] = Voter({
            voterAddress: msg.sender,
            token: votingToken,
            votes: new uint[](0)
        });

        addresses[votingToken] = msg.sender;

        nonce += 1;
        return votingToken;
    }

    function vote(uint voteIdx, bytes32 signedToken) external validVotingPeriod(voteIdx) tooManyVotes(msg.sender) checkTokenValidity(signedToken) {
        proposals[voteIdx].voteCount += 1;
        voters[msg.sender].votes.push(voteIdx);
    }

    function winningProposal() onlyAdmin public view returns (uint winningProposalId) {
        require(block.timestamp > endVoting, "Voting must be ended to find the winner");
        winningProposalId = 0;
        uint maximumVotes = 0;
        
        for (uint i = 0; i < proposals.length; ++i) {
            uint currentVotes = proposals[i].voteCount;
            if (currentVotes > maxVotes) {
                winningProposalId = i;
                maximumVotes = currentVotes;
            }
        }
    }
}