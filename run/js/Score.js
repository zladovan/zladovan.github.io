define(function(require){
	var PhaserDep = require('lib/phaser.min');
	
	function createScoreText(game) {
	    var scoreText = game.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000'});
		scoreText.fixedToCamera = true;
		return scoreText;
	}
	
    return function(game) {
        var score = 0;
        var scoreText = createScoreText(game); 
		
        return {
            sprite: scoreText,
            getValue: function() { return score; },
            add: function(amount) {
		        score += amount;
		        scoreText.text = 'Score: ' + score;
	        }
        };
        
    };
    
});