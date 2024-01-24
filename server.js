const app = require("./index");
// const http = require("http").createServer(app);
// const io = require("socket.io")(http);
require("dotenv").config();
const mongoose = require("mongoose");
const http = require('http');
const {Server} = require('socket.io');

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", (err) => {
  console.log("err", err);
});

mongoose.connection.on("connected", (err, res) => {
  console.log("mongoose connected");
});

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
      origin: '*', // Adjust this to allow specific origins
      methods: ['GET', 'POST'] // Define the methods you wish to allow
    }
  });

  app.get('/', (req, res) => {
    res.send('Hello, this is your Socket.IO server!');
  });

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (msg) => {
    console.log("Message: " + msg);

    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log("Server started at", process.env.PORT);
});
