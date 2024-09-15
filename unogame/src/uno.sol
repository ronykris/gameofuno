// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract UnoGame is ReentrancyGuard {
    uint256 private _gameIdCounter;
    uint256[] private _activeGames;

    struct Game {
        uint256 id;
        address[] players;
        bool isActive;
        uint256 currentPlayerIndex;
        bytes32 stateHash;
        uint256 lastActionTimestamp;
        uint256 turnCount;
        bool directionClockwise;
        bool isStarted;
    }

    struct Action {
        address player;
        bytes32 actionHash;
        uint256 timestamp;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => Action[]) public gameActions;

    event GameCreated(uint256 indexed gameId, address creator);
    event PlayerJoined(uint256 indexed gameId, address player);
    event GameStarted(uint256 indexed gameId, bytes32 initialStateHash);
    event ActionSubmitted(uint256 indexed gameId, address player, bytes32 actionHash);
    event GameEnded(uint256 indexed gameId);

    function createGame(address _creator) external nonReentrant returns (uint256) {
        _gameIdCounter++;
        uint256 newGameId = _gameIdCounter;

        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _creator)));
        bytes32 initialStateHash = keccak256(abi.encodePacked(newGameId, seed));

        games[newGameId] = Game({
            id: newGameId,
            players: new address[](0),
            isActive: true,
            currentPlayerIndex: 0,
            stateHash: initialStateHash,
            lastActionTimestamp: block.timestamp,
            turnCount: 0,
            directionClockwise: true,
            isStarted: false
        });
        _activeGames.push(newGameId);
        emit GameCreated(newGameId, _creator);
        return newGameId;
    }

    function startGame(uint256 gameId, bytes32 initialStateHash) external {
        Game storage game = games[gameId];
        require(!game.isStarted, "Game already started");
        require(game.players.length >= 2, "Not enough players");
        
        game.isStarted = true;
        game.stateHash = initialStateHash;
        game.lastActionTimestamp = block.timestamp;
        
        emit GameStarted(gameId, initialStateHash);
    }

    function joinGame(uint256 gameId, address _joinee) external nonReentrant {
        require(games[gameId].isActive, "Game is not active");
        require(games[gameId].players.length < 10, "Game is full");

        games[gameId].players.push(_joinee);
        emit PlayerJoined(gameId, _joinee);

        //if (games[gameId].players.length == 4) {
        //    startGame(gameId);
        //}
    }

    function hashState(Game memory game) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            game.id,
            game.players,
            game.isActive,
            game.currentPlayerIndex,
            game.lastActionTimestamp,
            game.turnCount,
            game.directionClockwise
        ));
    }

    function submitAction(uint256 gameId, bytes32 actionHash, address _actor) external nonReentrant {
        Game storage game = games[gameId];
        require(game.isActive, "Game is not active");
        require(isPlayerTurn(gameId, _actor), "Not your turn");

        game.stateHash = keccak256(abi.encodePacked(game.stateHash, actionHash));

        gameActions[gameId].push(Action({
            player: _actor,
            actionHash: actionHash,
            timestamp: block.timestamp
        }));

        updateGameState(gameId);

        emit ActionSubmitted(gameId, _actor, actionHash);
    }

    function updateGameState(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.turnCount++;
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        game.lastActionTimestamp = block.timestamp;
        game.stateHash = hashState(game);
    }

    function isPlayerTurn(uint256 gameId, address player) public view returns (bool) {
        return games[gameId].players[games[gameId].currentPlayerIndex] == player;
    }

    function endGame(uint256 gameId, address _actor) external {
        Game storage game = games[gameId];
        require(game.isActive, "Game is not active");
        require(isPlayerTurn(gameId, _actor), "Not your turn");

        game.isActive = false;
        removeFromActiveGames(gameId);
        emit GameEnded(gameId);
    }

    function removeFromActiveGames(uint256 gameId) internal {
        for (uint256 i = 0; i < _activeGames.length; i++) {
            if (_activeGames[i] == gameId) {
                _activeGames[i] = _activeGames[_activeGames.length - 1];
                _activeGames.pop();
                break;
            }
        }
    }

    function getGameState(uint256 gameId) external view returns (
        address[] memory players,
        bool isActive,
        uint256 currentPlayerIndex,
        bytes32 stateHash,
        uint256 lastActionTimestamp,
        uint256 turnCount,
        bool directionClockwise,
        bool isStarted
    ) {
        require(gameId > 0 && gameId <= _gameIdCounter, "Invalid game ID");
        Game storage game = games[gameId];
        require(game.id == gameId, "Game does not exist");
        return (
            game.players,
            game.isActive,
            game.currentPlayerIndex,
            game.stateHash,
            game.lastActionTimestamp,
            game.turnCount,
            game.directionClockwise,
            game.isStarted
        );
    }

    function getGameActions(uint256 gameId) external view returns (Action[] memory) {
        require(gameId > 0 && gameId <= _gameIdCounter, "Invalid game ID");
        require(games[gameId].id == gameId, "Game does not exist");
        
        return gameActions[gameId];
    }

    function getActiveGames() external view returns (uint256[] memory) {
        return _activeGames;
    }
}