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
    this.x = 0;
    this.y = 0;
    console.log("new Player.id:",this.socket.conn.id);
    //console.log(socket);
};

Player.prototype.make_newPlayer_msg = function() {
    return {nick: this.nick,
	    id: this.socket.conn.id};
};

Player.prototype.make_discoPlayer_msg = function() {
    return {nick: this.nick,
	    id: this.socket.conn.id};	    
};

Player.prototype.make_updatePlayer_msg = function() {
    return {x: this.x,
	    y: this.y,
	    id: this.socket.conn.id};	    
};

Player.prototype.move = function(args) {
    var old_x = this.x;
    var old_y = this.y;
    
    this.x = args.x;
    this.y = args.y;

    return (this.x != old_x || this.y != old_y);
};

Player.prototype.introduceOthers = function() {
    //for (var sock in this.socket.
    var socks = this.socket.server.sockets.sockets;
    for (var p in socks) {
	var player = socks[p].player;
	if (player) {
	    this.socket.emit('newPlayer',player.make_newPlayer_msg());
	}
    }

};



io.on('connection', function(socket){
    socket.on('joinGame', function(join_obj){
	console.log("join_obj",join_obj);
	var player_msg = {'nick': join_obj.nick};
	socket.player = new Player(join_obj, socket);
	io.emit('newPlayer',socket.player.make_newPlayer_msg());
	socket.player.introduceOthers();
    });
    socket.on('movePlayer', function(move_obj){
	var dirty = socket.player.move(move_obj);
	if (dirty) {
	    io.emit('updatePlayer',socket.player.make_updatePlayer_msg());
	}
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
