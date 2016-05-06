var loadState = {

	preload: function () {		
		// Add a loading label 
		var loadingLabel = game.add.text(game.world.centerX, 150, 'loading...', { font: '30px Arial', fill: '#ffffff' });
		loadingLabel.anchor.setTo(0.5, 0.5);

		// Add a progress bar
		var progressBar = game.add.sprite(game.world.centerX, 200, 'progressBar');
		progressBar.anchor.setTo(0.5, 0.5);
		game.load.setPreloadSprite(progressBar);

		// Load all assets
		game.load.spritesheet('mute', 'assets/muteButton.png', 28, 22);

		game.load.image('u', 'assets/sprites/unknown.png');
		game.load.image('r', 'assets/sprites/r.png');
		game.load.image('s', 'assets/sprites/s.png');
		game.load.image('r2', 'assets/sprites/r2.png');
		game.load.image('s2', 'assets/sprites/s2.png');
		game.load.image('c', 'assets/sprites/cap.png');
        game.load.image('approve','assets/sprites/approved.png');
        game.load.image('reject','assets/sprites/rejected.png');
		game.load.image('submit', 'assets/submit.png');
		
		//  Firefox doesn't support mp3 files, so use ogg
    game.load.audio('music', ['assets/music.mp3', 'assets/music.ogg']);
	},

	create: function() { 
		game.state.start('play');
	}
};
