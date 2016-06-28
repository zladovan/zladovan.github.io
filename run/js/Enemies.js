define(function(require){
	var PhaserDep = require('lib/phaser.min'),
		Enemy = require('Enemy');
		Bird = require('Bird');
    
	function createFx(game) {
        var fx = game.add.audio('sfx');
		fx.allowMultiple = true;
		fx.addMarker('auch', 1.675, 0.252);
		fx.addMarker('whoaa', 2.079, 0.576);
		return fx;
    }
    
    return function(game, ground, player, score) {
		var fx = createFx(game);
		//var fx = game.cache.getSound('sfx');
		//console.info("enemies sounds %o", fx);
		var enemies = game.add.group();
		// todo pool for custom sprite ?
		//enemies.createMultiple(20, 'baddie'); // todo max enemies on screen ?
		var enemyInfoMap = [];
		ground.events.onPlatformCreate.add(function(platform, seed) {
			var enemyInfo = enemyInfoMap[platform.index];
			if (new Phaser.RandomDataGenerator([seed + platform.index]).frac() > 0.9 && (!enemyInfo || !enemyInfo.wasKilledByPlayer)) {
				var EnemyConstructor = Math.random() > 0.75 ? Bird : Enemy;

				var enemy = new EnemyConstructor(game, platform.x, platform.y - platform.height / 2, platform.minX, platform.maxX);
				enemy.events.onKilledByPlayer.addOnce(function() { 
					var enemyInfo = enemyInfoMap[platform.index];
					enemyInfo.wasKilledByPlayer = true; 
					enemyInfo.sprite = null; 
					
				});
				enemies.add(enemy);
				enemyInfoMap[platform.index] = { sprite: enemy, wasKilledByPlayer: false };
			}
		});
		ground.events.onPlatformKill.add(function(platform) {
			var enemyInfo = enemyInfoMap[platform.index];
			if (enemyInfo && enemyInfo.sprite) {
				// todo save pos
				enemyInfo.sprite.kill();
				enemyInfo.sprite = null;
			}
		});
		
		player.body.onBeginContact.add(
			function(bodyA, bodyB, shapeA, shapeB, equation) {
				if (bodyA == null) return;

			    if (bodyA.sprite.key == 'baddie' || bodyA.sprite.key == 'bird') {
					if (player.isFalling && Math.abs(equation[0].normalA[1]) == 1) {
						bodyA.sprite.events.onKilledByPlayer.dispatch();
						bodyA.sprite.kill();
						player.body.moveUp(400);
						fx.play('whoaa');
						//player.jump();
						score.add(15);
						//console.info('Baddie kill');
					} else {
						player.damage(0.25);
						fx.play("auch");
						//healtText.text = "Health: " + Math.floor(player.health * 100) + " %";
						console.info('Aughrrr, bitch ! Health: %o', player.health);
					}
					console.info('Baddie hit, n1: %o n2: %o, eq: %o', equation[0].normalA[0], equation[0].normalA[1], equation);
				}
			},
			this);
		
		return enemies;
	}
});