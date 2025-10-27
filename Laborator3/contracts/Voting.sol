// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;

contract Voting{

    enum State { Active, Inactive, Locked } 

    struct Voter{
        bool voted;
        bytes32 token;
        uint[] votes;
    }

    struct Proposal{
        bytes32 projectName;
        string teamName;
        uint voteCount;
        State state;
    }

    address public admin;

    uint endVoting;

    uint endRegister;

    uint nonce;

    mapping(address => Voter) public voters;

    mapping(address => bool) hasVoted;

    mapping(bytes32 => bool) hasRegistered;

    Proposal[] public proposals;

    constructor(uint ndays) {
        admin = msg.sender;
        endRegister = block.timestamp + (ndays * 24 * 60 * 60);
        endVoting = block.timestamp + 2 * (ndays * 24 * 60 * 60);
    }


    function registerProposal(bytes32 projectName, string memory teamName) external {
        proposals.push(Proposal({
            projectName: projectName,
            teamName: teamName,
            voteCount: 0,
            state: State.Inactive
        }));
    }

    function setProposalState(uint idx, State state) external{
        proposals[idx].state = state;
    }

    function registerVoter(bytes32 registerToken) external returns (bytes32 votingToken){
        require(hasRegistered[registerToken] == false, "You have already registered");
        hasRegistered[registerToken] = true;
        bytes32 randToken = keccak256(abi.encodePacked(nonce, registerToken, block.timestamp));
        voters[msg.sender].token = randToken;
        voters[msg.sender].voted = false;
        votingToken = keccak256(abi.encodePacked(randToken, msg.sender));
        nonce += 1;
    }

    function vote(uint[] memory votes, bytes32 signedToken) external {
        require(block.timestamp <= endVoting, "Voting period has ended");
        require(hasVoted[msg.sender] == false, "You have already voted");
        hasVoted[msg.sender] = true;

        for(uint i = 0; i < votes.length; i++){
            proposals[votes[i]].voteCount += 1;
            voters[msg.sender].votes.push(votes[i]);
        }

        voters[msg.sender].voted = true;

    }

    function winningProposal() public view returns (uint winningProposalId){
        require(block.timestamp > endVoting, "Voting must be ended to find the winner");
        winningProposalId = 0;
        uint maxVotes = 0;
        
        for (uint i = 0; i < proposals.length; ++i) {
            uint currentVotes = proposals[i].voteCount;
            if (currentVotes > maxVotes) {
                winningProposalId = i;
                maxVotes = currentVotes;
            }
        }
    }      
}