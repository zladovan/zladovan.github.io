define(function(require) {
	var PhaserDep = require('lib/phaser.min'),
		NoiseGen = require('lib/libnoise/noisegen'),
		Perlin = require('lib/libnoise/module/generator/perlin');
	
	var PLATFORM_SPRITE_WIDTH = 400; // todo get from image
	var PLATFORM_BLOCK_WIDTH = 32;
	var PLATFORM_BLOCK_HEIGHT = PLATFORM_BLOCK_WIDTH;
	var PLATFORM_BLOCK_SCALE = PLATFORM_BLOCK_WIDTH / PLATFORM_SPRITE_WIDTH;
	var PLATFORM_MIN_BLOCK_COUNT = 1;
	var PLATFORM_MAX_BLOCK_COUNT = 8;	
	
	//						                            		freq luc oct pers
	var GENERATOR_FACTORY = function (seed) { return new Perlin(0.1, 2.0, 8, 0.5, seed, NoiseGen.QUALITY_STD); };
	

	Ground = function(game) {
		Phaser.Group.call(this, game);					

		this.createMultiple(Math.ceil(game.world.width / PLATFORM_BLOCK_WIDTH), 'ground');				
		this.platforms = [];		
		this.events = { onPlatformCreate: new Phaser.Signal(), onPlatformKill: new Phaser.Signal() };
		this.generator = this._initGenerator(game);		
		this.material = game.physics.p2.createMaterial('groundMaterial', this.body);		
	};

	Ground.prototype = Object.create(Phaser.Group.prototype);
	Ground.prototype.constructor = Phaser.Group;

	Ground.prototype.initFillScreen = function(game) {
		var platform = {minX: 0, index: -1, width: 0}; // fake 'zero' platform
		do {
			platform = this.generator.createPlatformNexTo(platform, false);															
		} while (platform.maxX < game.width);
	};
	
	Ground.prototype.update = function() {		
		var mostLeftPlatform = this.platforms[0];
		var mostRightPlatform = this.platforms[this.platforms.length - 1];
		var view = this.game.camera.view; 
		
		if (mostLeftPlatform.maxX < view.x) {
			console.info("Killing most left platform. viewX %d", view.x);
			mostLeftPlatform.kill();
			this.platforms.shift();
		} else if (mostLeftPlatform.minX > view.x) {
			this.generator.createPlatformNexTo(mostLeftPlatform, true);
		}

		if (mostRightPlatform.minX > view.right) {
			mostRightPlatform.kill();
			this.platforms.pop();
		} else if (mostRightPlatform.maxX < view.right) {
			this.generator.createPlatformNexTo(mostRightPlatform, false);
		}


		
	};

	Ground.prototype._initGenerator = function(game) {		
		var ground = this;
		var seed = Date.now();
		var generator = GENERATOR_FACTORY(seed);

		function getPlatformLength(index) {
			var rnd = new Phaser.RandomDataGenerator([seed + index]);
			return rnd.integerInRange(PLATFORM_MIN_BLOCK_COUNT, PLATFORM_MAX_BLOCK_COUNT);	
		}

		function getPlatformY(index) {
			var worldHalfHeight = game.world.height / 2
			var y = worldHalfHeight + worldHalfHeight * generator.getValue(index, 0, 0);
			y = y - y % PLATFORM_BLOCK_HEIGHT;
			return y;	
		}

		function createPlatform(x, y, length) {
			var platform = ground.getFirstDead();				
			platform.reset(x + length / 2 * PLATFORM_BLOCK_WIDTH, y);									
			platform.scale.set(PLATFORM_BLOCK_SCALE * length, 1);
			platform.maxX = platform.x + platform.width / 2;
			platform.minX = platform.x - platform.width / 2;
			if (platform.body) {
				platform.body.destroy();
				platform.body = null;
			}
			game.physics.p2.enable(platform);
			platform.body.static = true;
			platform.body.setMaterial(ground.material);
			return platform;
		}

		return {
			createPlatformNexTo: function(sibling, isLeft) {
				var sideFactor = isLeft ? -1 : 1;
				var index = sibling.index + sideFactor;
				var length = getPlatformLength(index);	
				var x = sibling.minX + (isLeft ? -length * PLATFORM_BLOCK_WIDTH : sibling.width);
				var y = getPlatformY(index);
				console.info("Create i: %o, x: %o, y: %o, l: %o, pw: %o, pmx: %o", index, x, y, length, sibling.width, sibling.minX);
				var platform = createPlatform(x, y, length);		
				platform.index = index;
				if (isLeft){
					ground.platforms.unshift(platform);	
				} else {
					ground.platforms.push(platform);
				}
				ground.events.onPlatformCreate.dispatch(platform, seed);
				platform.events.onKilled.add(function() { ground.events.onPlatformKill.dispatch(platform); }, this);
				return platform; 
			}
		};
	};

	
	
	

	return Ground;
});