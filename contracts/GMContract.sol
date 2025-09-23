// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GMContract {
    uint256 public constant COOLDOWN = 1 days;

    struct GM {
        address sender;
        uint256 timestamp;
    }

    GM[] public gms;
    mapping(address => uint256) public lastGM;

    event NewGM(address indexed sender, uint256 timestamp);

    function sendGM() external {
        require(block.timestamp >= lastGM[msg.sender] + COOLDOWN, "Wait 24h!");
        lastGM[msg.sender] = block.timestamp;
        gms.push(GM(msg.sender, block.timestamp));
        emit NewGM(msg.sender, block.timestamp);
    }

    function getTotalGMs() external view returns (uint256) {
        return gms.length;
    }

    function getRecentGMs(uint256 count) external view returns (GM[] memory) {
        uint256 length = gms.length;
        if (count > length) count = length;
        GM[] memory recent = new GM[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = gms[length - 1 - i];
        }
        return recent;
    }

    function getRemainingCooldown(address user) external view returns (uint256) {
        if (block.timestamp >= lastGM[user] + COOLDOWN) return 0;
        return lastGM[user] + COOLDOWN - block.timestamp;
    }
}
