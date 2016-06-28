define(function(require){
	var PhaserDep = require('lib/phaser.min'),
		NoiseGen = require('lib/libnoise/noisegen'),
    	Perlin = require('lib/libnoise/module/generator/perlin'),
    	Billow = require('lib/libnoise/module/generator/billow');
    
    // todo get from image
    var STAR_WIDTH = 24;
    var STAR_WIDTH_HALF = STAR_WIDTH / 2;
    var STAR_HEIGHT = 22;
    var STAR_HEIGHT_HALF = STAR_HEIGHT / 2;
    
    //						                            		freq luc oct pers
	var GENERATOR_FACTORY = function (seed) { return new Perlin(0.1, 2.0, 8, 0.5, seed, NoiseGen.QUALITY_STD); };
	//var GENERATOR_FACTORY = function (seed) { return new Billow(0.1, 2.0, 8, 0.5, seed, NoiseGen.QUALITY_STD); };
    
    function createFx(game) {
        var fx = game.add.audio('sfx');
		fx.allowMultiple = true;
		fx.addMarker('collect-star', 0.0, 0.458);
		return fx;
    }
    
    function createGroup(game) {
        var group = game.add.group();
		group.createMultiple(200, 'star'); // todo count max stars on screen
		//group.enableBody = true;	
		//group.physicsBodyType = Phaser.Physics.P2JS;
		//group.setAll('body.static', true);
		return group;
    }
    
    function collectStar(fx, star, score) {
		star.kill();
		score.add(10);
		fx.play('collect-star');
	}
    
    return function (game, ground, player, score) {
		var starMaterial = game.physics.p2.createMaterial('starMaterial');    
        var stars = createGroup(game);	
		var fx = createFx(game);
		var starsInfoMap = [];
		
		ground.events.onPlatformCreate.add(function(platform, seed) {
			var starsInfo = starsInfoMap[platform.index];
			if (!starsInfo) {
				starsInfo = [];
				starsInfoMap[platform.index] = starsInfo;
			}
			var generator = GENERATOR_FACTORY(seed);
            
            var yZero = platform.y - platform.height / 2 - 2.5 * STAR_HEIGHT;
            var yMax = 5;//new Phaser.RandomDataGenerator(seed + platform.index).integerInRange(0, 5);
            var ySpace = 5;
            var xMax = Math.floor(platform.width / STAR_WIDTH) - 1; if (xMax == 0) xMax = 1;
            var xSpace = (platform.width - (xMax * STAR_WIDTH)) / (xMax + 1);
            var xZero = platform.minX + STAR_WIDTH_HALF + xSpace;
            
            for (var y = 0; y < yMax; y++) {
    			for (var xIndex = 0; xIndex < xMax; xIndex++ ) { //+= STAR_WIDTH
    				if (generator.getValue(xIndex, y, platform.index) > 0.5) {
	    				var x = xZero + xIndex * (STAR_WIDTH + xSpace);
	    				var starInfo = starsInfo[[xIndex, y]];
	    				if (!starInfo || !starInfo.wasCollected) {
		    			    var star = stars.getFirstDead();
		    			    star.reset(x, yZero - y * (STAR_HEIGHT + ySpace));
		    			    if (star.body) {
								star.body.destroy();
								star.body = null;
							}
		    			    game.physics.p2.enable(star);
					        star.body.static = true;
					        star.body.data.shapes[0].sensor = true;
					        star.index = [xIndex, y];
					        star.platformIndex = platform.index;
					        starsInfoMap[star.platformIndex][star.index] = {sprite: star, wasCollected: false};
	    				}
    				}
    			}
            }
			
// 			if (new Phaser.RandomDataGenerator([seed + platform.index]).frac() > 0.9 && (!enemyInfo || !enemyInfo.wasKilledByPlayer)) {
// 				var enemy = new Enemy(game, platform.x, platform.y - platform.height / 2, platform.minX, platform.maxX);
// 				enemy.events.onKilledByPlayer.addOnce(function() { 
// 					var enemyInfo = enemyInfoMap[platform.index];
// 					enemyInfo.wasKilledByPlayer = true; 
// 					enemyInfo.sprite = null; 
					
// 				});
// 				enemies.add(enemy);
// 				enemyInfoMap[platform.index] = { sprite: enemy, wasKilledByPlayer: false };
// 			}
		});
		
		ground.events.onPlatformKill.add(function(platform) {
			var starsInfo = starsInfoMap[platform.index];
			if (starsInfo) {
				for (var starIndex in starsInfo) {
					var star = starsInfo[starIndex];
					if (star.sprite) {
						star.sprite.kill();
						star.sprite = null;
					}
				}
			}
		});
		
		player.body.onBeginContact.add(
    		function(bodyA, bodyB, shapeA, shapeB, equation) {
    			if (bodyA == null) return;

    			if (bodyA.sprite.key == 'star') {
    				var star = bodyA.sprite;
    				collectStar(fx, star, score);
    				var starInfo = starsInfoMap[star.platformIndex][star.index];
    				starInfo.wasCollected = true;
    				starInfo.sprite = null;
    			}
    			
    			// console.info(
    			// 	"Hit with %s A %o B %o eq %o",
    			// 	body.sprite.key,
    			// 	shapeA,
    			// 	shapeB,
    			// 	equation);	
    		}, 
    		this);

		
		return stars;
    };
});