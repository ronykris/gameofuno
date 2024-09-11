const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const ws = require("ws");
const path = require('path');


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
        console.log(newState)

        // Emit the gameStarted event to all clients in the room with a room-specific event name
        io.to(roomId).emit(`gameStarted-${roomId}`, { newState, cardHashMap });
    });

    // Add playCard event handler
    socket.on('playCard', (data) => {
        const { roomId, action, newState } = data;
        console.log(`Card played in room ${roomId}`);
        console.log('New state:', newState);

        // Broadcast the cardPlayed event to all clients in the room
        io.to(roomId).emit(`cardPlayed-${roomId}`, { action, newState });
    });

    // Add leave room functionality
    socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
        io.to(roomId).emit("userLeft", socket.id);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});