// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract FidelityPoints {
    error NotFound();
    error InsufficientPoints(uint available, uint required);
    error UnauthorizedSpender();
    error InvalidPointValue();

    uint public nbCalls;

    address public admin;
    mapping(address => bool) public authorizedSpenders;
    uint public pointValue;

    uint private totalPoints;

    mapping(address => uint) public points;
    mapping(address => uint) public lifetimePointsEarned;
    mapping(address => uint) public lifetimePointsSpent;

    event PointsAdded(address indexed client, uint points);
    event PointsSpent(address indexed client, uint points);
    event PointValueChanged(uint oldValue, uint newValue);
    event SpenderAuthorized(address indexed spender);
    event SpenderRevoked(address indexed spender);

    constructor(uint _pointValue) {
        if (_pointValue == 0) revert InvalidPointValue();
        admin = msg.sender;
        pointValue = _pointValue;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyAuthorizedSpender() {
        if (msg.sender != admin && !authorizedSpenders[msg.sender]) {
            revert UnauthorizedSpender();
        }
        _;
    }

    function authorizeSpender(address spender) external onlyAdmin {
        authorizedSpenders[spender] = true;
        emit SpenderAuthorized(spender);
    }

    function revokeSpender(address spender) external onlyAdmin {
        authorizedSpenders[spender] = false;
        emit SpenderRevoked(spender);
    }

    function addPoints(address client, uint _points) public onlyAdmin {
        points[client] += _points;
        lifetimePointsEarned[client] += _points;
        _updateTotalPoints(int(_points));
        emit PointsAdded(client, _points);
    }

    function spendPointsFrom(address client, uint _points) external onlyAuthorizedSpender {
        if (points[client] < _points) {
            revert InsufficientPoints(points[client], _points);
        }

        points[client] -= _points;
        lifetimePointsSpent[client] += _points;
        _updateTotalPoints(-int(_points));
        emit PointsSpent(client, _points);
    }

    function spendPoints(uint _points) public {
        if (points[msg.sender] < _points) {
            revert InsufficientPoints(points[msg.sender], _points);
        }

        points[msg.sender] -= _points;
        lifetimePointsSpent[msg.sender] += _points;
        _updateTotalPoints(-int(_points));
        emit PointsSpent(msg.sender, _points);
    }

    function setPointValue(uint _pointValue) public onlyAdmin {
        if (_pointValue == 0) revert InvalidPointValue();
        uint oldValue = pointValue;
        pointValue = _pointValue;
        emit PointValueChanged(oldValue, _pointValue);
    }

    function getTotalValue(address client) public view returns (uint totalValue) {
        totalValue = points[client] * pointValue;
    }

    function _updateTotalPoints(int256 _change) internal {
        if (_change > 0) {
            totalPoints += uint256(_change);
        } else {
            totalPoints -= uint256(-_change);
        }
    }

    function getTotalPoints() public view returns (uint256) {
        return totalPoints;
    }

    function canAfford(address client, uint requiredValue)
    external
    returns (uint requiredPoints)
    {
        nbCalls += 1;

        if (points[client] == 0) {
            revert NotFound();
        }

        requiredPoints = (requiredValue + pointValue - 1) / pointValue;

        require(
            this.getTotalValue(client) >= requiredValue,
            "Insufficient Funds!"
        );
    }

    function getClientStats(address client)
    external
    view
    returns (
        uint currentPoints,
        uint totalEarned,
        uint totalSpent,
        uint totalValue
    )
    {
        currentPoints = points[client];
        totalEarned = lifetimePointsEarned[client];
        totalSpent = lifetimePointsSpent[client];
        totalValue = getTotalValue(client);
    }

    function getBalance(address client) external view returns (uint) {
        return points[client];
    }
}