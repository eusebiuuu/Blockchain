// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./FidelityPoints.sol";

contract Caller{

    FidelityPoints public bonusPointsContract;
    uint public nbCallsError;
    uint public nbCallsRevert;
    uint public nbCallsPanic;
    uint public nbCalls;
    event RequiredPointsFailure(string message);
    event RequiredPointsErrorCode(uint errorCode);
    event RequiredPointsReverts(bytes rev);


    constructor(address _bonusPointsAddress) {
        bonusPointsContract = FidelityPoints(_bonusPointsAddress);
    }

    function calculateRequiredPoints(address client, uint requiredValue) public returns (uint) {
        nbCalls += 1;

        try bonusPointsContract.getRequiredPoints(client, requiredValue) returns (uint requiredPoints) {
            return requiredPoints;
        }
        catch Error(string memory reason) {
            nbCallsError += 1;
            emit RequiredPointsFailure(reason);
        }
        catch Panic(uint errorCode) {
            nbCallsPanic += 1;
            emit RequiredPointsErrorCode(errorCode);
        }
        catch (bytes memory r) {
            nbCallsRevert += 1;
            emit RequiredPointsReverts(r);
        }

        return bonusPointsContract.getRequiredPoints(client, requiredValue);
    }

}
