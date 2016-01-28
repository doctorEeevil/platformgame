// http://expressjs.com/
var express = require('express');
var app = express();

// http://expressjs.com/starter/static-files.html
app.use(express.static('public')); // serves /public/index.html
app.use("/phaser", express.static('node_modules/phaser/dist'));

var server = require('http').createServer(app);

// https://github.com/socketio/socket.io
var io = require('socket.io')(server);

io.on('connection', function(socket){
    socket.on('newShip', function(data){
	console.log(data);
    });
  socket.on('disconnect', function(){});
});

console.log();
console.log("  surf to http://localhost:3000/");
console.log("  press Ctrl-C to quit :)");
console.log();
console.log("  love Dad");
console.log();
server.listen(3000);// "192.168.1.20");
