define(function(require) {
	var PhaserDep = require('lib/phaser.min'),
		StateMachine = require('lib/state-machine.min');	

	Player = function(game, x, y) {
		Phaser.Sprite.call(this, game, x, y, 'dude');

		game.physics.p2.enable(this);	
		this.alive = true;
		this.body.damping = 0.5;
		this.body.fixedRotation = true;
		this.animations.add('left', [0, 1, 2, 3], 10, true);	
		this.animations.add('right', [5, 6, 7, 8], 10, true);

		this.cursors = game.input.keyboard.createCursorKeys();
		
		this.fx = game.add.audio('sfx');
		this.fx.allowMultiple = true;	
		this.fx.addMarker('jump', 0.488, 0.134);
		this.fx.addMarker('land', 0.740, 0.078);

		this.walkingSound = game.add.audio('sfx');
		this.walkingSound.addMarker('walk', 0.946, 0.286);

		this.material = game.physics.p2.createMaterial('playerMaterial', this.body);
		
		this.stateMachine = StateMachine.create({
			initial: 'idle',

			events: [
				{ name: 'move', from: 'idle', to: 'walking' },
				{ name: 'stop', from: 'walking', to: 'idle' },
				{ name: 'jump', from: ['idle', 'walking'], to: 'jumping'},
				{ name: 'fall', from: ['idle', 'walking', 'jumping'], to: 'falling'},
				{ name: 'land', from: 'falling', to: 'idle'}
			],	

			callbacks: {
				onmove: function(event, from, to, player) { 
					console.log("MOVE");
					//player.body.velocity.y = 0;
					player.walkingSound.play('walk', 0, 1, true, false);
				},
				

				onland: function(event, from, to, player) {
					console.info("LAND");
					player.fx.play('land');
					player.resetAnimations();
					player.body.velocity.y = 0;
				},

				onjump: function(event, from, to, player) {
					player.fx.play('jump');
					player.body.moveUp(300);
				},

				onleavewalking: function(event, from, to, player) {
					player.walkingSound.stop();
					player.resetAnimations();
				},
				
				onfall: function(event, from, to, player) {
					player.isFalling = true;
				},
				
				onleavefalling: function(event, from, to, player) {
					player.isFalling = false;
				}/*

				onidle: function(event, from, to, player) {				
					player.animations.stop();
					player.frame = 4;
				},*/

				
			}
		});

		this.updateForState = {
			walking: function(player) {
				if (player.cursors.left.isDown) {
					player.body.velocity.x = -150;
					player.animations.play('left');
				} else if (player.cursors.right.isDown) {
					player.body.velocity.x = 150;
					player.animations.play('right')
				} else {
					player.stateMachine.stop(player);	
				}			
				this.checkJump(player);
				this.checkFall(player);	
			},

			idle: function(player) {
				if (player.cursors.right.isDown || player.cursors.left.isDown) {
					player.stateMachine.move(player);
				}	
				this.checkJump(player);		
				this.checkFall(player);
			},

			falling: function(player) {
				//if (player.body.velocity.y > -1) {
				if (player.body.velocity.y <= 0) {
					player.stateMachine.land(player);
				} /*else {
					console.info("velocity.y %f", player.body.velocity.y);
				}*/
				this.handleInAir(player);	
			},

			jumping: function(player) {
				this.handleInAir(player);	
				this.checkFall(player);
			},

			checkJump: function(player) {			
				if (player.cursors.up.isDown ) {
					//console.info("velocity.y %d", player.body.velocity.y);
					player.stateMachine.jump(player);
				}
			},

			handleInAir: function(player) {			
				if (player.cursors.left.isDown) {
					player.body.velocity.x = -150;
					player.frame = 1;
				} else if (player.cursors.right.isDown) {
					player.body.velocity.x = 150;				
					player.frame = 8;
				}	
			},

			checkFall: function(player) {			
				if (player.body.velocity.y > 10) {				
					console.info("FALL %d", player.body.velocity.y);
					player.stateMachine.fall(player);
				}
			}


		}
	};

	Player.prototype = Object.create(Phaser.Sprite.prototype);
	Player.prototype.constructor = Player;

	Player.prototype.update = function() {
		this.body.velocity.x = 0;	
		this.updateForState[this.stateMachine.current](this);
	};

	Player.prototype.resetAnimations = function() {
		this.animations.stop();
		this.frame = 4;
	}
	
	// Player.prototype.jump = function() {
	// 	this.stateMachine.jump();
	// }

	return Player;
});