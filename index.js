const express = require("express");
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const userRouter = require("./routes/user");
const { checkUsertoken } = require("./middleware/auth");
const cookieParser = require("cookie-parser");
const User = require("./models/user");
const Msg = require("./models/msg");

mongoose
  .connect("mongodb://127.0.0.1:27017/chat-app")
  .then(() => console.log("MongoDB Connected"));
const app = express();
const PORT = 8000;
const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use(checkUsertoken("token"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.static(path.resolve("./public")));

app.get("/", async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  let allUser = await User.find({});
  console.log(allUser);
  return res.render("home", { user: req.user || null , allUser: allUser });
});
app.use("/user", userRouter);

app.get("/chat/:friendId", async (req, res) => {
  const friendId = req.params.friendId;
  const friend = await User.findById(friendId)

  const messages = await Msg.find({
    $or: [
      { sender: req.user._id, receiver: friendId },
      { sender: friendId, receiver: req.user._id },
    ],
  }).sort({ createdAt: 1 });
  
  // console.log("############################################################")
  // console.log(messages)
  res.json({ user: req.user, friend, messages });
});

let onlineUsers = {}; // store userId -> socketId mapping

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // when user joins
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    // console.log("Online Users:", onlineUsers);
  });

  // private message
  socket.on("private-msg", async ({ senderId, receiverId, content }) => {
    // save to DB
    // console.log("======================")
    // console.log( senderId, receiverId, content )
    const msg = await Msg.create({
      sender: senderId,
      receiver: receiverId,
      content: content,
    });

    // send only to receiver if online
    if (onlineUsers[receiverId]) {
      io.to(onlineUsers[receiverId]).emit("private-msg", msg);
    }

    // also send back to sender (to update UI)
    io.to(socket.id).emit("private-msg", msg);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
    // remove from onlineUsers
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) delete onlineUsers[userId];
    }
  });
});

server.listen(PORT, () => console.log("Server Connected"));
