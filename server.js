// http://expressjs.com/
var fs = require('fs');
var express = require('express');
var app = express();

var server = require('http').createServer(app);

// https://github.com/socketio/socket.io
var io = require('socket.io')(server);


/***************************************
 * 
 ***************************************/

var Game = function Game() {
    this.gameNum = this.randomGameNumber();
    this.gameUrl = "#" + this.gameNum;
    this.all[this.gameNum] = this;
};

Game.prototype.randomGameNumber = function() {
    return Math.round(Math.random() * 10000);
};

Game.prototype.all = {};

Game.prototype.gotoGameMsg = function() {
   return {gameNum: this.gameNum};
};

Game.prototype.join = function(join_obj, socket) {
    a_game = Game.all[join_obj.gameNum];
    console.log("Game.join()",a_game.gameNum);
};

Game.prototype.monotonedudesPath = 'public/assets/monotonedudes';

Game.prototype.dudeFNames = fs.readdirSync(
    Game.prototype.monotonedudesPath);

/***************************************
 *            P L A Y E R
 ***************************************/

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
    socket.on('newGame', function(new_obj){
	console.log("newGame",new_obj);
	var game = new Game();
	socket.emit('gotoGame',game.gotoGameMsg());
    });    
    socket.on('joinGame', function(join_obj){
	console.log("join_obj",join_obj);
	// Game.prototype.join(join_obj, socket);
	var player_msg = {};
	socket.join(join_obj.gameNum);
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


// http://expressjs.com/starter/static-files.html
app.use(express.static('public')); // serves /public/index.html
app.use("/phaser", express.static('node_modules/phaser/dist'));


var port = 31016;
console.log("  surf to http://localhost:"+port+"/");
console.log("  press Ctrl-C to quit");
server.listen(port);
