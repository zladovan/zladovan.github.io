define(function(require){
	var PhaserDep = require('lib/phaser.min');

	var ENEMY_HEIGHT = 32; // todo get from sprite
	Enemy = function(game, x, y, minX, maxX) {
		Phaser.Sprite.call(this, game, x, y - ENEMY_HEIGHT / 2, 'baddie');

		this.minX = minX;
		this.maxX = maxX;
		this.hasPlaceToMove = Math.abs(maxX - minX)  > this.width;
		this.isLeft = Math.random() > 0.5;

		game.physics.p2.enable(this);	
		this.body.setZeroDamping();
		this.body.fixedRotation = true;
		this.animations.add('left', [0, 1], 10, true);	
		this.animations.add('right', [2, 3], 10, true);		
		this.material = game.physics.p2.createMaterial('enemyMaterial', this.body);

		this.events.onKilledByPlayer = new Phaser.Signal();
	};

	Enemy.prototype = Object.create(Phaser.Sprite.prototype);
	Enemy.prototype.constructor = Enemy;

	Enemy.prototype.update = function() {
		this.body.velocity.x = 0;	
		
		if (this.hasPlaceToMove && this.body.velocity.y > -1 ) {
			if (this.isLeft) {
				if (this.x - this.width / 2 < this.minX) {
					this.isLeft = false;
				} else {
					this.body.velocity.x = -100;	
					this.animations.play('left');	
				}			
			} else {
				if (this.x + this.width / 2 > this.maxX) {
					this.isLeft = true;
				} else {
					this.body.velocity.x = 100;		
					this.animations.play('right');	
				}				
			}
		}
		//console.info('Enemy update %o, width: %o, x: %o', this, this.width, this.x);
		//this.updateForState[this.stateMachine.current](this);
	};

	Enemy.prototype.resetAnimations = function() {
		this.animations.stop();
		this.frame = 1
	}

	return Enemy;
});