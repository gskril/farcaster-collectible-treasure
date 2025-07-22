// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {Treasure} from "../src/Treasure.sol";

contract TreasureScript is Script {
    Treasure public treasure;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        treasure = new Treasure(address(0x0), bytes32(0x0));

        vm.stopBroadcast();
    }
}
