var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , bodyParser = require("body-parser")
  , io = require("socket.io").listen(http)
  , _ = require("underscore");
app.set("port", 3000);

var participants = [];
app.use(express.static( __dirname  + "/public"));
app.use(bodyParser.json());

app.post("/message", function (request, response) {
  var message = request.body.message;
  if (_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, { error: "Message is invalid" });
  }
  var name = request.body.name;
  io.sockets.emit("incomingMessage", { message: message, name: name, sessionId: request.body.sessionId });
  response.json(200, { message: "Message received" });
});

io.on("connection", function (socket) {
  socket.on("newUser", function (data) {
    participants.push({ id: data.id, name: data.name });
    io.sockets.emit("newConnection", { participants: participants });
  });

  socket.on("nameChange", function (data) {
    _.findWhere(participants, { id: socket.id }).name = data.name;
    io.sockets.emit("nameChanged", { id: data.id, name: data.name });
  });

  socket.on("disconnect", function () {
    participants = _.without(participants, _.findWhere(participants, { id: socket.id }));
    io.sockets.emit("userDisconnected", { id: socket.id, sender: "system" });
  });
});

http.listen(app.get("port"), function () {
  console.log("Server up and running. at port", app.get("port"));
});