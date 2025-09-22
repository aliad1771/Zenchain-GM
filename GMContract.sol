// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title GMContract - simple "GM" counter with per-address 24h cooldown
contract GMContract {
    struct GM {
        address sender;
        uint256 timestamp;
    }

    GM[] private gms;
    mapping(address => uint256) public lastSent;
    uint256 public constant COOLDOWN = 24 hours;

    event NewGM(address indexed sender, uint256 timestamp);

    /// @notice Send a GM. Enforces one GM per address per COOLDOWN period.
    function sendGM() external {
        uint256 last = lastSent[msg.sender];
        require(block.timestamp >= last + COOLDOWN, "Cooldown: wait before sending again");
        lastSent[msg.sender] = block.timestamp;
        gms.push(GM(msg.sender, block.timestamp));
        emit NewGM(msg.sender, block.timestamp);
    }

    /// @notice Total number of GMs recorded
    function getTotalGMs() external view returns (uint256) {
        return gms.length;
    }

    /// @notice Retrieve up to `count` most recent GMs (most-recent-first)
    function getRecentGMs(uint256 count) external view returns (GM[] memory) {
        uint256 total = gms.length;
        if (count > total) count = total;
        GM[] memory out = new GM[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = gms[total - 1 - i];
        }
        return out;
    }

    /// @notice Remaining cooldown seconds for `user`. 0 if ready.
    function getRemainingCooldown(address user) external view returns (uint256) {
        uint256 last = lastSent[user];
        if (block.timestamp >= last + COOLDOWN) return 0;
        return (last + COOLDOWN) - block.timestamp;
    }
}
