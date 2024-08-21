const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w"; //W for white

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); //add to use staic files added in our directory i.e. images, fonts.

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

//whenever any user come on our website this will work io.on and function call will work
io.on("connection", function (socket) {
  console.log("connected");

  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else socket.emit("spectatorRole");

  //In any case if frontend and backend connection break then this event is autmatically called.
  socket.on("disconnect", function () {
    //console.log("disconnected event automatically called when net ")
    if (socket.id === players.black) delete players.black;
    else if (socket.id === players.white) delete players.white;
  });

  socket.on("move", (move)=>{
    try {
        if(chess.turn() === "w" && socket.id !== players.white) return;
        if(chess.turn() === "b" && socket.id !== players.black) return;
        
        const res = chess.move(move);
        if(res){
            currentPlayer = chess.turn();
            io.emit("move", move); // we are semding it to frontend
            io.emit("boardState", chess.fen()); //io is used when we want eveyone should recieve.
        }
        else{
            console.log("Something went wrong");
            socket.emit("invalid move", move);//socket is used whenwe want to receieve and send information to specific or current user i.e. white or black
        }
    } catch (e)  {
        console.log(e);
        socket.emit("Invalid move: ", move);
    }
  });

});




server.listen(3000, function () {
  console.log("listening on port 3000.");
});
