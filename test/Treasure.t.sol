// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Treasure} from "../src/Treasure.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TreasureTest is Test {
    Treasure public treasure;
    MockCollectible public collectible;
    MockERC20 public erc20;

    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    function setUp() public {
        collectible = new MockCollectible();
        treasure = new Treasure(address(collectible), bytes32(0x0));

        // Add some assets to the treasure
        erc20 = new MockERC20();
        erc20.mint(address(treasure), 100 ether);
        vm.deal(address(treasure), 100 ether);

        // Give the owner the collectible
        collectible.mint(user1);
    }

    function test_UserHasNft() public view {
        assertEq(collectible.ownerOf(0), user1);
    }

    function test_OwnerCanWithdrawEth() public {
        vm.prank(user1);
        treasure.withdrawEth();
        assertEq(address(user1).balance, 100 ether);
    }

    function test_RandoCantWithdrawEth() public {
        vm.prank(user2);
        vm.expectRevert(Treasure.NotCastOwner.selector);
        treasure.withdrawEth();
    }

    function test_OwnerCanWithdrawErc20() public {
        vm.prank(user1);
        treasure.withdrawErc20(erc20, user1, 100 ether);
        assertEq(erc20.balanceOf(user1), 100 ether);
    }

    function test_RandoCantWithdrawErc20() public {
        vm.prank(user2);
        vm.expectRevert(Treasure.NotCastOwner.selector);
        treasure.withdrawErc20(erc20, user1, 100 ether);
    }

    function test_OwnerCanWithdrawErc20ToOtherAddress() public {
        vm.prank(user1);
        treasure.withdrawErc20(erc20, user2, 100 ether);
        assertEq(erc20.balanceOf(user2), 100 ether);
    }

    function test_RandoCantWithdrawErc20ToOtherAddress() public {
        vm.prank(user2);
        vm.expectRevert(Treasure.NotCastOwner.selector);
        treasure.withdrawErc20(erc20, user2, 100 ether);
    }

    function test_OwnerCanBatchWithdrawErc20() public {
        vm.prank(user1);
        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = erc20;
        treasure.withdrawErc20Batch(tokens);
        assertEq(erc20.balanceOf(address(treasure)), 0);
        assertEq(erc20.balanceOf(user1), 100 ether);
    }

    function test_TreasureCanReceieveEth() public {
        vm.deal(address(user1), 100 ether);

        // Transfer ETH to the treasure
        vm.prank(user1);
        (bool success, ) = address(treasure).call{value: 100 ether}("");
        if (!success) revert();

        assertEq(address(treasure).balance, 200 ether);
        assertEq(address(user1).balance, 0);
    }
}

contract MockCollectible is ERC721 {
    constructor() ERC721("MockCollectible", "MC") {}

    // Mint tokenId 0 to the owner, which would be the id for cast hash 0x0
    function mint(address to) public {
        _mint(to, 0);
    }
}

contract MockERC20 is ERC20 {
    constructor() ERC20("MockERC20", "ME") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
