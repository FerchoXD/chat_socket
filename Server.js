const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const { Socket } = require("socket.io");
const globalUsers = new Set();

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 8,
  message: "exediste el límite de solicitudes permitidas de 5 peticiones"
});

app.use(limiter);
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let users = new Array();
let storage = new Map();


io.on("connection", function (socket) {

  console.log("Usuario conectado");

  socket.on("CreateUser", (username) => {
    console.log(users)
    if (users.includes(username)) {
      io.to(socket.id).emit("Response", {
        res: false,
        msg: "Este nombre de usuario esta en uso",
      });
    } else {
      users.push(username);
      socket.names = username;
      storage.set(socket.names, socket.id);
      console.log(socket.id)
      console.log(storage.get(username))
      io.to(socket.id).emit("Response", { res: true, username: username });
    }
  });

  socket.on('list', (data)=>{
    io.sockets.emit('users', users)
  })

  socket.on("disconnect", function () {
    console.log("Usuario desconectado");
  });

  socket.on("set username", function (username) {
    console.log("Usuario: " + username);
    socket.nicknames = username;
    socketsP.set(socket.nicknames, socket.id);
  });

  socket.on("chat message", function (msg) {
    console.log("Mensaje: " + msg);
    io.emit("chat message", msg);
  });

  socket.on("chat image", function (data) {
    console.log("Imagen recibida");
    io.emit("chat image", data);
  });

  socket.on('messagePrivate', (data)=>{
    console.log("Entro en message-private")
    let receptor = storage.get(data.receptor)
    io.to(socket.id).emit('responseMP', {emisor: socket.names, message: data.message})
    io.to(receptor).emit('responseMP', {emisor: socket.names, message: data.message})
  })

  socket.on("chat imagePrivate", function (data) {
    console.log("Imagen recibida de froma privada xd");
    let receptor = data.receptor;
    let emisor = socket.names;
    let img = data.img;
    console.log(receptor);
    console.log(emisor);
    io.to(storage.get(emisor)).emit("chat imagePrivate", {
      emisor: emisor,
      img: img,
    });
    io.to(storage.get(receptor)).emit("chat imagePrivate", {
      emisor: emisor,
      img: img,
    });
  });
});

http.listen(3000,  function () {
  console.log("Servidor escuchando en el puerto 3000");
});
