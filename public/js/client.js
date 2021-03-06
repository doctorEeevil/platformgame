var game = new Phaser.Game(800, 600, Phaser.AUTO, '',
			   { preload: preload, create: create, update: update });

var socket;

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.spritesheet('dude_yellow', 'assets/dude_yellow.png', 32, 48);

    socket = io();
    socket.on('newPlayer', newPlayer);
    socket.on('updatePlayer', updatePlayer);
    socket.on('gotoGame', gotoGame);

    if (document.location.hash) {
	var gameNum = document.location.hash.replace('#','');
	socket.emit('joinGame', {'gameNum': gameNum});
    } else {
	socket.emit('newGame', {});
    }
}

var player;
var others;
var platforms;
var cursors;

var stars;
var score = 0;
var scoreText;
var currentLevel;

function populateLevel(currentLevel) {
  if (currentLevel.platforms) {
    for (var plat_no = 0; plat_no < currentLevel.platforms.length ; plat_no++) {
      var plat = currentLevel.platforms[plat_no];
      var ledge = platforms.create(plat.x, plat.y, 'ground');
      ledge.body.immovable = true;
    }
  }
}

function loadLevel(levelFileName) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      currentLevel = JSON.parse(xhr.responseText);
      populateLevel(currentLevel);
    }
  };
  xhr.open("GET", "/levels/"+levelFileName, true);
  xhr.send();
}

function create() {

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.stage.backgroundColor = '#74c9e5';
    //  A simple background for our game
    // game.add.sprite(0, 0, 'sky');
    game.world.setBounds(0,0,3500, game.height);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    // Here we create the ground.
    var ground = platforms.create(0, game.world.height - 64, 'ground');

    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(10, 2);

    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    //  Now let's create two ledges
    loadLevel('world.json');

    // The player and its settings
    player = game.add.sprite(32, game.world.height - 150, 'dude');

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.collideWorldBounds = true;
    player.body.gravity.y = 350;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    //  Finally some stars to collect
    stars = game.add.group();

    //  We will enable physics for any star that is created in this group
    stars.enableBody = true;

    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < 12; i++)
    {
        //  Create a star inside of the 'stars' group
        var star = stars.create(i * 70, 0, 'star');

        //  Let gravity do its thing
        star.body.gravity.y = 300;

        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }

    //  The score
    scoreText = game.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    others = game.add.group();
}

function update() {

    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);

    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;

    if (cursors.down.isDown){
	player.body.gravity.y = 3000;
    }else{
	player.body.gravity.y = 350;
    }

    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -150;
        player.animations.play('left');
	game.camera.x = player.body.x - 300;
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 150;
        player.animations.play('right');
	game.camera.x = player.body.x - 300;
    }
    else
    {
        //  Stand still
        player.animations.stop();
        player.frame = 4;
    }
    scoreText.x = game.camera.x + 16;
    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }

    player.current_x = Math.round(player.body.x);
    player.current_pos = {
	x: Math.round(player.body.x),
	y: Math.round(player.body.y)};
    if (!player.last_pos) {
	player.last_pos = {};
    }
    if (player.current_pos.x != player.last_pos.x ||
	player.current_pos.y != player.last_pos.y) {
	player.last_pos.x = player.current_pos.x;
	player.last_pos.y = player.current_pos.y;
	socket.emit('movePlayer',player.current_pos);
    }
}

function collectStar (player, star) {
    // Removes the star from the screen
    star.kill();

    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;
}

function newPlayer(msg) {
    console.log("newPlayer", msg);
    console.log("socket",socket);
    if (msg.id != socket.id) {
	var dude = others.create(0,0, 'dude_yellow');
	dude.nick = msg.nick;
	dude.other_id = msg.id;
	console.log("others",others);
    }    
}

function updatePlayer(msg) {
    var other;
    if (msg.id != socket.id) {
	//console.log("updatePlayer", msg);
	for (var i = 0; i < others.children.length; i++) {
	    //console.log("i:",i);
	    other = others.children[i];
	    //console.log("other",other);
	    if (other.other_id == msg.id) {
		other.x = msg.x;
		other.y = msg.y;
	    }
	}
    }
}

function gotoGame(msg) {
    document.location.hash = msg.gameNum;
}
