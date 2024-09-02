// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/uno.sol";

contract UnoGameTest is Test {
    UnoGame unoGame;
    address[10] players;

    function setUp() public {
        unoGame = new UnoGame();
        for(uint i = 0; i < 10; i++) {
            players[i] = address(uint160(i + 1));
        }
    }

    function testCreateGame() public {
        vm.prank(players[0]);
        uint256 gameId = unoGame.createGame();
        assertEq(gameId, 1, "First game should have ID 1");

        (address[] memory gamePlayers, bool isActive, , , , , ,) = unoGame.getGameState(gameId);
        assertEq(gamePlayers.length, 0, "Game should start with no players");
        assertTrue(isActive, "Game should be active");
    }

    function testJoinGame() public {
        uint256 gameId = unoGame.createGame();

        vm.prank(players[0]);
        unoGame.joinGame(gameId);

        vm.prank(players[1]);
        unoGame.joinGame(gameId);

        (address[] memory gamePlayers, , , , , , ,) = unoGame.getGameState(gameId);
        assertEq(gamePlayers.length, 2, "Game should have 2 players");
        assertEq(gamePlayers[0], players[0], "First player should be players[0]");
        assertEq(gamePlayers[1], players[1], "Second player should be players[1]");
    }

    function testCannotJoinFullGame() public {
        uint256 gameId = unoGame.createGame();

        for(uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            unoGame.joinGame(gameId);
        }

        vm.expectRevert("Game is full");
        vm.prank(address(0x100));
        unoGame.joinGame(gameId);
    }

    function testSubmitAction() public {
        uint256 gameId = unoGame.createGame();

        vm.prank(players[0]);
        unoGame.joinGame(gameId);
        vm.prank(players[1]);
        unoGame.joinGame(gameId);

        bytes32 actionHash = keccak256("action1");
        vm.prank(players[0]);
        unoGame.submitAction(gameId, actionHash, false, false, false, false);

        UnoGame.Action[] memory actions = unoGame.getGameActions(gameId);
        assertEq(actions.length, 1, "Should have 1 action");
        assertEq(actions[0].player, players[0], "Action should be from players[0]");
        assertEq(actions[0].actionHash, actionHash, "Action hash should match");
    }

    function testCannotSubmitActionWhenNotYourTurn() public {
        uint256 gameId = unoGame.createGame();

        vm.prank(players[0]);
        unoGame.joinGame(gameId);
        vm.prank(players[1]);
        unoGame.joinGame(gameId);

        bytes32 actionHash = keccak256("action1");
        vm.prank(players[1]);
        vm.expectRevert("Not your turn");
        unoGame.submitAction(gameId, actionHash, false, false, false, false);
    }

    function testUpdateGameStateNormal() public {
        uint256 gameId = unoGame.createGame();

        for(uint i = 0; i < 3; i++) {
            vm.prank(players[i]);
            unoGame.joinGame(gameId);
        }

        bytes32 actionHash = keccak256("action1");
        vm.prank(players[0]);
        unoGame.submitAction(gameId, actionHash, false, false, false, false);

        (, , uint256 currentPlayerIndex, , , uint256 turnCount, ,) = unoGame.getGameState(gameId);
        assertEq(currentPlayerIndex, 1, "Current player should be the second player");
        assertEq(turnCount, 1, "Turn count should be 1");
    }

    function testUpdateGameStateReverse() public {
        uint256 gameId = unoGame.createGame();

        for(uint i = 0; i < 3; i++) {
            vm.prank(players[i]);
            unoGame.joinGame(gameId);
        }

        bytes32 actionHash = keccak256("action1");
        vm.prank(players[0]);
        unoGame.submitAction(gameId, actionHash, true, false, false, false);

        (, , uint256 currentPlayerIndex, , , uint256 turnCount, bool directionClockwise,) = unoGame.getGameState(gameId);
        assertEq(currentPlayerIndex, 2, "Current player should be the third player");
        assertEq(turnCount, 1, "Turn count should be 1");
        assertFalse(directionClockwise, "Direction should be counter-clockwise");
    }

    function testUpdateGameStateSkip() public {
        uint256 gameId = unoGame.createGame();

        for(uint i = 0; i < 3; i++) {
            vm.prank(players[i]);
            unoGame.joinGame(gameId);
        }

        bytes32 actionHash = keccak256("action1");
        vm.prank(players[0]);
        unoGame.submitAction(gameId, actionHash, false, true, false, false);

        (, , uint256 currentPlayerIndex, , , uint256 turnCount, ,) = unoGame.getGameState(gameId);
        assertEq(currentPlayerIndex, 2, "Current player should be the third player");
        assertEq(turnCount, 1, "Turn count should be 1");
    }

    function testEndGame() public {
        uint256 gameId = unoGame.createGame();

        vm.prank(players[0]);
        unoGame.joinGame(gameId);
        vm.prank(players[1]);
        unoGame.joinGame(gameId);

        vm.prank(players[0]);
        unoGame.endGame(gameId);

        (,bool isActive, , , , , ,) = unoGame.getGameState(gameId);
        assertFalse(isActive, "Game should not be active");
    }

    function testCannotEndGameWhenNotYourTurn() public {
        uint256 gameId = unoGame.createGame();

        vm.prank(players[0]);
        unoGame.joinGame(gameId);
        vm.prank(players[1]);
        unoGame.joinGame(gameId);

        vm.prank(players[1]);
        vm.expectRevert("Not your turn");
        unoGame.endGame(gameId);
    }
}