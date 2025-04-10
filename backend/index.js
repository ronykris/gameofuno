const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const ws = require("ws");
const path = require('path');
const {addUser, removeUser, getUser, getUsersInRoom} = require("./users");
const { createClaimableBalance } = require("./diamnetService");

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
    wsEngine: ws.Server,
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API endpoint for creating claimable balances
app.post("/api/create-claimable-balance", async (req, res) => {
  try {
    const { winnerAddress, gameId } = req.body;
    
    // Validate the request
    if (!winnerAddress) {
      return res.status(400).json({ error: "Winner address is required" });
    }
    
    // Create the claimable balance
    const result = await createClaimableBalance(winnerAddress);
    
    // Return success response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error creating claimable balance:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create claimable balance" 
    });
  }
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static("frontend/build"));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "build", "index.html"));
    });
}

server.listen(PORT, () => {
    console.log(`server started on Port ${PORT}`);
});

io.on("connection", (socket) => {
    console.log(`user ${socket.id} has connected`);
    io.to(socket.id).emit("server_id", socket.id);

    // Add room functionality
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        io.to(roomId).emit("userJoined", socket.id);
    });

    // Add game room creation handler
    socket.on("createGameRoom", () => {
        console.log(`Game room created by user`);
        io.emit("gameRoomCreated");
    });

    socket.on('gameStarted', (data) => {
        const { newState, cardHashMap, roomId } = data;
        console.log(`Game started in room ${roomId}`);
        // console.log(newState)

        // Emit the gameStarted event to all clients in the room with a room-specific event name
        io.to(roomId).emit(`gameStarted-${roomId}`, { newState, cardHashMap });
    });

    // Add playCard event handler
    socket.on('playCard', (data) => {
        const { roomId, action, newState } = data;
        console.log(`Card played in room ${roomId}`);
        // console.log('New state:', newState);

        // Broadcast the cardPlayed event to all clients in the room
        io.to(roomId).emit(`cardPlayed-${roomId}`, { action, newState });
    });

    // Add leave room functionality
    socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
        io.to(roomId).emit("userLeft", socket.id);
    });

    socket.on("join", (payload, callback) => {
        let numberOfUsersInRoom = getUsersInRoom(payload.room).length;

        const { error, newUser } = addUser({
            id: socket.id,
            name: numberOfUsersInRoom === 0 ? "Player 1" : "Player 2",
            room: payload.room,
        });

        if (error) return callback(error);

        socket.join(newUser.room);

        io.to(newUser.room).emit("roomData", { room: newUser.room, users: getUsersInRoom(newUser.room) });
        socket.emit("currentUserData", { name: newUser.name });
        console.log(newUser)
        callback();
    });

    socket.on("initGameState", (gameState) => {
        const user = getUser(socket.id);
        if (user) io.to(user.room).emit("initGameState", gameState);
    });

    socket.on("updateGameState", (gameState) => {
        const user = getUser(socket.id);
        if (user) io.to(user.room).emit("updateGameState", gameState);
    });

    socket.on("sendMessage", (payload, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit("message", { user: user.name, text: payload.message });
        callback();
    });

    socket.on("quitRoom", () => {
        const user = removeUser(socket.id);
        if (user) io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});