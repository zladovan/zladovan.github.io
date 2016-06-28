define(function(require){
	var PhaserDep = require('lib/phaser.min'),
		StateMachine = require('lib/state-machine.min');	

	var ENEMY_HEIGHT = 10;
	var ENEMY_WIDTH = 30;
	Bird = function(game, x, y, minX, maxX) {
		Phaser.Sprite.call(this, game, x, y - 48 / 2 - 100, 'bird');

		this.minX = minX + ENEMY_WIDTH / 2;
		this.maxX = maxX - ENEMY_WIDTH / 2;
		this.hasPlaceToMove = Math.abs(maxX - minX)  > this.width;
		this.isLeft = Math.random() > 0.5; 
		this.x = this.isLeft ? this.minX : this.maxX;	

		this.attackPath = [];
		this.attackStep = 0;
		for (var step = 0.0; step < 1.0; step += 1.5 / (this.maxX - this.minX)) {
			var node_x = this.game.math.linearInterpolation([this.minX, x, this.maxX], step);
			var node_y = this.game.math.linearInterpolation([y - 48 / 2 - 100, y - 48 / 2, y - 48 / 2 - 100], step);
			this.attackPath.push([node_x, node_y]);
		}	
		this.attackStepMiddle = this.attackPath.length / 2;

		game.physics.p2.enable(this);	
		this.body.setZeroDamping();
		this.body.fixedRotation = true;
		this.body.setRectangle(ENEMY_WIDTH, ENEMY_HEIGHT);

		//this.body.mass = 0;
		this.animations.add('standby-left', [0, 1, 2, 3, 4, 5, 6, 7], 10, true);
		this.animations.add('attack-left', [8, 9, 10], 3, false);
		this.animations.add('standby-right', [11, 12, 13, 14, 15, 16, 17, 18], 10, true);
		this.animations.add('attack-right', [19, 20, 21], 3, false);
		this.material = game.physics.p2.createMaterial('enemyMaterial', this.body);

		this.events.onKilledByPlayer = new Phaser.Signal();

		this.startAttackTimer = function() {
			this.game.time.events.add(Phaser.Timer.SECOND * 5, function() { this.stateMachine.attack(this); }, this);
		}

		this.stateMachine = StateMachine.create({
			initial: 'standby',

			events: [
				{ name: 'attack', from: 'standby', to: 'attacking' },
				{ name: 'returnToStay', from: 'attacking', to: 'returning' },
				{ name: 'stay', from: 'returning', to: 'standby' },
			],	

			callbacks: {
				onattack: function(event, from, to, bird) { 
					console.log("BIRD: ATTACK");					
					bird.attackStep = bird.isLeft ? 0 : bird.attackPath.length - 1;
					bird.attackStepChange = bird.isLeft ? 1 : -1;
					bird.animations.play(bird.isLeft ? 'attack-right' : 'attack-left');						
				},
				

				onreturnToStay: function(event, from, to, bird) {
					console.info("BIRD: RETURNING")
				},

				onstay: function(event, from, to, bird) {
					bird.isLeft = !bird.isLeft;
					bird.startAttackTimer();
				}
			}
		});

		this.updateForState = {
			standby: function(bird) {
				bird.body.velocity.y = -5 + 3 * Math.sin(bird.game.time.now / 300);
				bird.animations.play(bird.isLeft ? 'standby-right' : 'standby-left');
			},

			attacking: function(bird) {
				this.updateAttackPosition(bird);
				if ((bird.attackStep > bird.attackStepMiddle && bird.isLeft) || (bird.attackStep < bird.attackStepMiddle && !bird.isLeft)) {
					bird.stateMachine.returnToStay(bird);
				}
			},

			returning: function(bird) {
				this.updateAttackPosition(bird);
				if (bird.attackStep < 0 || bird.attackStep >= bird.attackPath.length) {
					bird.stateMachine.stay(bird);
				}	
				bird.animations.play(bird.isLeft ? 'standby-right' : 'standby-left');			
			},

			updateAttackPosition: function(bird) {
				var node = bird.attackPath[bird.attackStep];
				bird.body.x = node[0];
				bird.body.y = node[1];
				bird.attackStep += bird.attackStepChange;
			}

		}

		this.startAttackTimer();
	};

	Bird.prototype = Object.create(Phaser.Sprite.prototype);
	Bird.prototype.constructor = Bird;

	Bird.prototype.update = function() {		
		this.body.velocity.x = 0;	
		this.updateForState[this.stateMachine.current](this);
	};

	return Bird;
});