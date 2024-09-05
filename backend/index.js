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

class Deck {
    constructor() {
        this.deck = [];
        this.reset(); //Add 52 cards to the deck
        this.shuffle(); //Suffle the deck
    } //End of constructor

    reset() {
        this.deck = [];
        const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        const values = ["Ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "Jack", "Queen", "King"];

        for (let suit in suits) {
            for (let value in values) {
                this.deck.push(values[value] + " of " + suits[suit]);
            }
        }
    } //End of reset()

    shuffle() {
        let numberOfCards = this.deck.length;
        for (var i = 0; i < numberOfCards; i++) {
            let j = Math.floor(Math.random() * numberOfCards);
            let tmp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = tmp;
        }
    } //End of shuffle()

    deal() {
        return this.deck.pop();
    } //End of deal()

    isEmpty() {
        return this.deck.length == 0;
    } //End of isEmpty()

    length() {
        return this.deck.length;
    } //End of length()
} //End of Deck Class

var sockets = {};

let card1, card2, card3, card4, card5;
const cardValues = {
    "Ace of Hearts": 1,
    "2 of Hearts": 2,
    "3 of Hearts": 3,
    "4 of Hearts": 4,
    "5 of Hearts": 5,
    "6 of Hearts": 6,
    "7 of Hearts": 7,
    "8 of Hearts": 8,
    "9 of Hearts": 9,
    "10 of Hearts": 10,
    "Jack of Hearts": 11,
    "Queen of Hearts": 12,
    "King of Hearts": 13,
    "Ace of Diamonds": 1,
    "2 of Diamonds": 2,
    "3 of Diamonds": 3,
    "4 of Diamonds": 4,
    "5 of Diamonds": 5,
    "6 of Diamonds": 6,
    "7 of Diamonds": 7,
    "8 of Diamonds": 8,
    "9 of Diamonds": 9,
    "10 of Diamonds": 10,
    "Jack of Diamonds": 11,
    "Queen of Diamonds": 12,
    "King of Diamonds": 13,
    "Ace of Clubs": 1,
    "2 of Clubs": 2,
    "3 of Clubs": 3,
    "4 of Clubs": 4,
    "5 of Clubs": 5,
    "6 of Clubs": 6,
    "7 of Clubs": 7,
    "8 of Clubs": 8,
    "9 of Clubs": 9,
    "10 of Clubs": 10,
    "Jack of Clubs": 11,
    "Queen of Clubs": 12,
    "King of Clubs": 13,
    "Ace of Spades": 1,
    "2 of Spades": 2,
    "3 of Spades": 3,
    "4 of Spades": 4,
    "5 of Spades": 5,
    "6 of Spades": 6,
    "7 of Spades": 7,
    "8 of Spades": 8,
    "9 of Spades": 9,
    "10 of Spades": 10,
    "Jack of Spades": 11,
    "Queen of Spades": 12,
    "King of Spades": 13,
};
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

    socket.on("gameStarted", (cardHashMap) => {
        console.log(cardHashMap);
        
        // Broadcast cardHashMap to all other connected sockets
        socket.broadcast.emit("receiveCardHashMap", cardHashMap);

        console.log(`Game started by ${socket.id}`);
    });

});