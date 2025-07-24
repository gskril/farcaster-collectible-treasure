// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title Treasure
/// @author gregskril.eth
/// @notice Basket of assets that can be withdrawn by the owner of a specified Farcaster collectible cast.
/// @dev ETH and/or ERC20s are supported.
contract Treasure {
    bytes32 public immutable CAST_HASH;
    IERC721 public immutable COLLECTIBLE;

    event Erc20Withdrawn(address indexed to, address indexed token, uint256 amount);
    event EthDeposited(address indexed from, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);

    error NotCastOwner();
    error TransferFailed();

    modifier onlyCastOwner() {
        if (COLLECTIBLE.ownerOf(uint256(CAST_HASH)) != msg.sender) {
            revert NotCastOwner();
        }
        _;
    }

    constructor(address _collectible, bytes32 _castHash) {
        COLLECTIBLE = IERC721(_collectible);
        CAST_HASH = _castHash;
    }

    // @dev Allow the contract to receive ETH.
    receive() external payable {
        emit EthDeposited(msg.sender, msg.value);
    }

    /// @notice Transfer the entire balance of ETH to the cast owner.
    function withdrawEth() external onlyCastOwner {
        uint256 balance = address(this).balance;
        (bool success,) = msg.sender.call{value: balance}("");
        if (!success) revert TransferFailed();
        emit EthWithdrawn(msg.sender, balance);
    }

    /// @notice Transfer the entire balance of the specified ERC20 token to the cast owner.
    function withdrawErc20(IERC20 token) external onlyCastOwner {
        uint256 balance = token.balanceOf(address(this));
        _withdrawErc20(token, msg.sender, balance);
    }

    /// @notice Transfer the entire balance of the specified ERC20s to the cast owner.
    function withdrawErc20Batch(IERC20[] calldata tokens) external onlyCastOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = tokens[i].balanceOf(address(this));
            _withdrawErc20(tokens[i], msg.sender, balance);
        }
    }

    /// @notice Transfer the entire balance of the specified ERC20 token to the specified address.
    function withdrawErc20(IERC20 token, address to, uint256 amount) external onlyCastOwner {
        _withdrawErc20(token, to, amount);
    }

    /// @notice The token id of the collectible cast.
    /// @dev This is deterministic based on the cast hash.
    function tokenId() external view returns (uint256) {
        return uint256(CAST_HASH);
    }

    function _withdrawErc20(IERC20 token, address to, uint256 amount) internal {
        bool success = IERC20(token).transfer(to, amount);
        if (!success) revert TransferFailed();
        emit Erc20Withdrawn(to, address(token), amount);
    }
}
