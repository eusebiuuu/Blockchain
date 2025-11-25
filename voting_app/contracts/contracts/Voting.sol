// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;

contract Voting {

    enum State {Active, Inactive, Locked}

    struct Voter {
        bool voted;
        bytes32 token;
        uint[] votes;
    }

    struct Proposal {
        bytes32 projectName;
        string teamName;
        string gitAddress;
        uint voteCount;
        State state;
    }


    modifier votingActive (bool active){
        require((endRegister < block.timestamp && endVoting >= block.timestamp) == active, active ? "voting is over!" : "voting still active");
        _;
    }

    modifier registrationActive () {
        require(endRegister >= block.timestamp, "Registration is closed!");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == admin, "Only admin!");
        _;
    }

    event ProposalStateChanged(uint indexed proposalIndex, State oldState, State newState);

    event VoteCast(address indexed voter, uint indexed proposalIndex);

    event ProposalAdded(address indexed proposer, string indexed participant1, string indexed participant2, string teamName, string gitAddress, uint proposalIdx);

    address public admin;

    uint endRegister;
    uint endVoting;

    uint nonce;

    uint maxVotes;

    mapping(address => Voter) public voters;

    mapping(address => bool)  teamMember;

    Proposal[] public proposals;

    constructor(uint regdays, uint votedays, uint _maxvotes) {
        admin = msg.sender;

        endRegister = block.timestamp + (regdays * 24 * 60 * 60);
        endVoting = block.timestamp + ((votedays + regdays) * 24 * 60 * 60);

        maxVotes = _maxvotes;
    }


    function registerProposal(bytes32 projectName, string memory teamName, string memory gitAddress, string memory participant1, string memory participant2) public /*registrationActive*/ {
        require(teamMember[msg.sender] == false, "You already registerd a project!");

        proposals.push(Proposal({
            projectName: projectName,
            teamName: teamName,
            gitAddress: gitAddress,
            voteCount: 0,
            state: State.Inactive
        }));

        teamMember[msg.sender] = true;
        emit ProposalAdded(msg.sender, participant1, participant2, teamName, gitAddress, proposals.length - 1);
    }

    function getNumberOfProposals() external view returns (uint) {
        return proposals.length;
    }

    function getProposal(uint idx) external view returns (bytes32 projectName, string memory teamName, string memory gitAddress, uint voteCount, State state) {
        require(idx < proposals.length, "Index out of bounds");
        Proposal memory proposal = proposals[idx];
        return (proposal.projectName, proposal.teamName, proposal.gitAddress, proposal.voteCount, proposal.state);
    }


    function setProposalState(uint idx, State newState) public onlyOwner {
        require(idx < proposals.length, "Index out of bounds");
        State oldState = proposals[idx].state;
        proposals[idx].state = newState;
        emit ProposalStateChanged(idx, oldState, newState);
    }

    function extendRegisterDates(uint ndays) public onlyOwner /*registrationActive*/ {
        endRegister += (ndays * 24 * 60 * 60);
        endVoting += (ndays * 24 * 60 * 60);
        assert(endVoting > endRegister);
    }

    function extendVotingDates(uint ndays) public onlyOwner /*votingActive (true) */{
        endVoting += (ndays * 24 * 60 * 60);
        assert(endVoting > endRegister);
    }

    function registerVoter(bytes32 registerToken) external returns (bytes32 votingToken){
        bytes32 randToken = keccak256(abi.encodePacked(nonce, registerToken, block.timestamp));
        voters[msg.sender].token = randToken;
        voters[msg.sender].voted = false;
        votingToken = keccak256(abi.encodePacked(randToken, msg.sender));
        nonce += 1;
    }

    function vote(uint[] memory votes/*, bytes memory signedToken*/) public /*votingActive(true)*/ {
        require(votes.length <= maxVotes, "Exceeded maximum votes!");
        require(voters[msg.sender].voted == false, "Already voted!");

        bytes32 randToken = voters[msg.sender].token;
        bytes32 votingToken = keccak256(abi.encodePacked(randToken, msg.sender));

        //bool validSig = checkSignature(signedToken, votingToken, msg.sender);

        //require(validSig, "Invalid signature!");

        for (uint i = 0; i < votes.length; i++) {
            require(proposals[votes[i]].state == State.Active, "Invalid proposal state!");

            proposals[votes[i]].voteCount += 1;
            voters[msg.sender].votes.push(votes[i]);
            emit VoteCast(msg.sender, votes[i]);
        }

        voters[msg.sender].voted = true;
    }


    function topProposals(uint limit) public view /*votingActive(false)*/ returns (uint[] memory winningProposalId){
        require(limit > 0 && limit <= proposals.length, "Invalid limit");

        uint[] memory indices = new uint[](proposals.length);
        uint[] memory voteCounts = new uint[](proposals.length);

        for (uint i = 0; i < proposals.length; i++) {
            indices[i] = i;
            voteCounts[i] = proposals[i].voteCount;
        }

        // Bubble sort to get top proposals (descending order by vote count)
        for (uint i = 0; i < proposals.length - 1; i++) {
            for (uint j = 0; j < proposals.length - i - 1; j++) {
                if (voteCounts[j] < voteCounts[j + 1]) {
                    // Swap vote counts
                    (voteCounts[j], voteCounts[j + 1]) = (voteCounts[j + 1], voteCounts[j]);
                    // Swap indices
                    (indices[j], indices[j + 1]) = (indices[j + 1], indices[j]);
                }
            }
        }

        winningProposalId = new uint[](limit);
        for (uint i = 0; i < limit; i++) {
            winningProposalId[i] = indices[i];
        }

        return winningProposalId;
    }

    function sigRSV(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function checkSignature(bytes memory sig, bytes32 text, address sender) public pure returns (bool rez) {
        (bytes32 r, bytes32 s, uint8 v) = sigRSV(sig);
        bytes32 hashMsg = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", text));
        rez = (ecrecover(hashMsg, v, r, s) == sender);
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }

    function getActiveProposals() external view returns (Proposal[] memory activeProposals, uint[] memory indices) {
        uint activeCount = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].state == State.Active) {
                activeCount++;
            }
        }

        activeProposals = new Proposal[](activeCount);
        indices = new uint[](activeCount);

        uint currentIndex = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].state == State.Active) {
                activeProposals[currentIndex] = proposals[i];
                indices[currentIndex] = i;
                currentIndex++;
            }
        }

        return (activeProposals, indices);
    }

    function getMaxVotes() external view returns (uint256){
        return maxVotes;
    }

    function getContractParams() external view returns(uint256, uint256){
        return (maxVotes, endVoting);
    }

}
