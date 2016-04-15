var playState = {

	create: function() { 
		// Name of the game
		var nameLabel = game.add.text(game.world.centerX, 80, 'Acceptance', { font: '50px Arial', fill: '#ffffff' });
		nameLabel.anchor.setTo(0.5, 0.5);

		music = game.add.audio('music');

    music.play();

		// Add a mute button
		this.muteButton = game.add.button(20, 20, 'mute', this.toggleSound, this);
		this.muteButton.input.useHandCursor = true;
		if (game.sound.mute) {
			this.muteButton.frame = 1;
		}
	},

	toggleSound: function() {
		game.sound.mute = ! game.sound.mute;
		this.muteButton.frame = game.sound.mute ? 1 : 0;	
	},
};
