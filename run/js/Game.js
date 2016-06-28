require(['lib/phaser.min', 'Player', 'Ground', 'Enemies', 'Score', 'Stars'], function(PhaserDep, Player, Ground, Enemies, Score, Stars) {
	var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

	var ground;
	var player;	
	var score;
	// var healtText;
	var fx;

	function preload() {
		game.load.image('sky', 'assets/sky.png');
		game.load.image('ground', 'assets/platform.png');
		game.load.image('star', 'assets/star.png');
		game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
		game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
		game.load.spritesheet('bird', 'assets/bird.png', 48, 48);
		game.load.audio('sfx', 'assets/sfx.ogg');
	}

	function create() {
		
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setBoundsToWorld(true, false, false, false); // left, right, top, bottom
		//game.physics.p2.setImpactEvents(true);
		game.physics.p2.gravity.y = 300;
		
		var sky = game.add.sprite(0, 0, 'sky');	
		sky.fixedToCamera = true;

		fx = game.add.audio('sfx');
		fx.allowMultiple = true;
		fx.addMarker('collect-star', 0.0, 0.458);
		fx.addMarker('land', 0.740, 0.078);
		fx.addMarker('auch', 1.675, 0.252);
		fx.addMarker('whoaa', 2.079, 0.576);
		fx.addMarker('bird-scream', 2.730, 1.5);

		score = Score(game);
		ground = new Ground(game);		
		game.add.existing(ground);
		player = game.add.existing(new Player(game, 32, 0));	
		game.add.existing(Enemies(game, ground, player, score));
		game.add.existing(Stars(game, ground, player, score));
		ground.initFillScreen(game);
		
		// healtText = game.add.text(600, 16, 'Health: 100 %', { fontSize: '32px', fill: '#000'});
		// healtText.fixedToCamera = true;
		
		//game.camera.setSize(100, 100);
		game.camera.follow(player);

		player.events.onKilled.add(function() {
			alert('You are dead, bitch !\n\nYour score: ' + score.getValue());
			document.location.reload(true);
		});

		
		var groundPlayerCM = game.physics.p2.createContactMaterial(player.material, ground.material, { friction: 0.0 });
	}

	function update() {
		
		//player.update();
		/*console.info(
			'camera x: %o y: %o player x: %o y: %o', 
			game.camera.x,
			game.camera.y,
			player.position.x,
			player.position.y);	*/
		
		if (player.position.x > game.camera.view.centerX || game.camera.view.x > 0) {			
			game.world.setBounds(
				Phaser.Math.clampBottom(player.position.x - game.width / 2, 0), 
				0, 
				game.width, 
				game.height);
		}
		
		ground.update();
		//enemy.update();
		//game.physics.arcade.collide(stars, platforms);
		//game.physics.arcade.overlap(player, stars, collectStar, null, this);
	}

	
});