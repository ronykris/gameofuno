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

    socket.on("gameStarted", (data) => {
        const { cardHashMap, newState, roomId } = data;
        console.log(`Game started in room ${roomId}`);
        console.log(cardHashMap);
        console.log(newState);
        
        // Broadcast cardHashMap and newState to all other connected sockets in the room
        socket.to(roomId).emit("receiveGameStart", { cardHashMap, newState });
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