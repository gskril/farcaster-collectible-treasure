// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Treasure} from "../src/Treasure.sol";

contract TreasureTest is Test {
    Treasure public treasure;

    function setUp() public {
        treasure = new Treasure(address(0x0), bytes32(0x0));
    }

    function test_CastOwner() public view {
        assertEq(treasure.CAST_HASH(), bytes32(0x0));
    }
}
