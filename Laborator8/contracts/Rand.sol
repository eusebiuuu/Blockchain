// SPDX-License-Identifier: GPL-3.0
// https://docs.chain.link/vrf/v2-5/supported-networks

pragma solidity ^0.8.28;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";


contract Rand is VRFConsumerBaseV2Plus {

    //requestRandomWords
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
    }

    mapping(uint256 => RequestStatus) public requests;

    uint256[] public requestIds;
    uint256 public lastRequestId;


    VRFConsumerBaseV2Plus COORDINATOR;

    //job funding subscription or direct call
    uint256 subscriptionId;
    //address immutable linkToken;

    //functions as an ID of the off-chain VRF job that runs in response to requests.
    //value is substituted in the contract’s runtime code by the compiler, stored in bytecode.
    bytes32 immutable keyHash;

    //The limit for how much gas to use for the callback request to your contract's fulfillRandomWords function.
    uint32 callbackGasLimit = 150000;

    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    //the random number from the request response
    uint public randomWordsNum;


    constructor(
        uint256 _subscriptionId
    )
    VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B)
    {
        subscriptionId = _subscriptionId;
        keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    }

    function requestRandomWords() public onlyOwner returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });

        requestIds.push(requestId);
        lastRequestId = requestId;

        emit RequestSent(requestId, numWords);
        return requestId;
    }


    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        require(requests[_requestId].exists, "request not found");
        requests[_requestId].fulfilled = true;
        requests[_requestId].randomWords = _randomWords;
        randomWordsNum = _randomWords[0];
        emit RequestFulfilled(_requestId, _randomWords);
    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(requests[_requestId].exists, "request not found");
        RequestStatus memory request = requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }

    function getRandom() public returns (uint256 ) {
        uint256 requestId = requestRandomWords();
        uint256 rand = randomWordsNum % 1000;
        return rand;
    }

}


