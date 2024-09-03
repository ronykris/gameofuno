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
        uint256 seed;
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
    event ActionSubmitted(uint256 indexed gameId, address player, bytes32 actionHash);
    event GameEnded(uint256 indexed gameId);

    function createGame() external nonReentrant returns (uint256) {
        _gameIdCounter++;
        uint256 newGameId = _gameIdCounter;

        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender)));
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
            seed: seed
        });
        _activeGames.push(newGameId);
        emit GameCreated(newGameId, msg.sender);
        return newGameId;
    }

    function joinGame(uint256 gameId) external nonReentrant {
        require(games[gameId].isActive, "Game is not active");
        require(games[gameId].players.length < 10, "Game is full");

        games[gameId].players.push(msg.sender);
        emit PlayerJoined(gameId, msg.sender);

        if (games[gameId].players.length == 4) {
            startGame(gameId);
        }
    }

    function startGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        require(game.players.length >= 2, "Not enough players");
        game.seed = uint256(keccak256(abi.encodePacked(game.seed, block.timestamp, block.difficulty)));
        game.stateHash = keccak256(abi.encodePacked(game.stateHash, game.seed));
    }

    function submitAction(uint256 gameId, bytes32 actionHash, bool isReverse, bool isSkip, bool isDrawTwo, bool isWildDrawFour) external nonReentrant {
        Game storage game = games[gameId];
        require(game.isActive, "Game is not active");
        require(isPlayerTurn(gameId, msg.sender), "Not your turn");

        game.stateHash = keccak256(abi.encodePacked(game.stateHash, actionHash));

        gameActions[gameId].push(Action({
            player: msg.sender,
            actionHash: actionHash,
            timestamp: block.timestamp
        }));

        updateGameState(gameId, isReverse, isSkip, isDrawTwo, isWildDrawFour);

        emit ActionSubmitted(gameId, msg.sender, actionHash);
    }

    function updateGameState(uint256 gameId, bool isReverse, bool isSkip, bool isDrawTwo, bool isWildDrawFour) internal {
        Game storage game = games[gameId];
        
        if (isReverse) {
            game.directionClockwise = !game.directionClockwise;
        }

        uint256 playerCount = game.players.length;
        uint256 nextPlayerIndex;

        if (isSkip || isDrawTwo || isWildDrawFour) {
            nextPlayerIndex = game.directionClockwise ? 
                (game.currentPlayerIndex + 2) % playerCount :
                (game.currentPlayerIndex + playerCount - 2) % playerCount;
        } else {
            nextPlayerIndex = game.directionClockwise ? 
                (game.currentPlayerIndex + 1) % playerCount :
                (game.currentPlayerIndex + playerCount - 1) % playerCount;
        }

        game.currentPlayerIndex = nextPlayerIndex;
        game.lastActionTimestamp = block.timestamp;
        game.turnCount++;
    }

    function isPlayerTurn(uint256 gameId, address player) public view returns (bool) {
        return games[gameId].players[games[gameId].currentPlayerIndex] == player;
    }

    function endGame(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.isActive, "Game is not active");
        require(isPlayerTurn(gameId, msg.sender), "Not your turn");

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
        uint256 seed
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
            game.seed
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