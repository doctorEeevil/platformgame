// http://expressjs.com/
var express = require('express');
var app = express();

// http://expressjs.com/starter/static-files.html
app.use(express.static('public')); // serves /public/index.html
app.use("/phaser", express.static('node_modules/phaser/dist'));

var server = require('http').createServer(app);

// https://github.com/socketio/socket.io
var io = require('socket.io')(server);

var Player = function Player(obj, socket) {
    this.socket = socket;
    this.nick = obj.nick;
    console.log("newPlayer:",this.nick);
    //console.log(socket);
};

Player.prototype.make_newPlayer_msg = function() {
    return {nick: this.nick};    
};

Player.prototype.make_discoPlayer_msg = function() {
    return {nick: this.nick};
};

io.on('connection', function(socket){
    socket.on('joinGame', function(join_obj){
	console.log(join_obj);
	var player_msg = {'nick': join_obj.nick};
	socket.player = new Player(join_obj, socket)
	io.emit('newPlayer',socket.player.make_newPlayer_msg())
    });
    socket.on('disconnect', function(socket){
	if (socket.player) {
            io.emit('discoPlayer', socket.player.make_discoPlayer_msg());
	}
    });
});

console.log();
console.log("  surf to http://localhost:3000/");
console.log("  press Ctrl-C to quit :)");
console.log();
console.log("  love Dad");
console.log();
server.listen(3000);// "192.168.1.20");
