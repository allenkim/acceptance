var timer;
socket.on('timerval', function(num) {
	console.log(num);
	timer = num;
});

var playState = {

	eztimer: function() {
		socket.emit('StartTimer', timer);	
		var id = setInterval(function() { 
			timer = timer - 1; 
			if (timer <= 0) { clearInterval(id); } 
		}, 1000);
	},
	create: function() { 
		// Name of the game
		timer = 20;
		this.eztimer();

		nameLabel = game.add.text(game.world.centerX, 80, timer.toString(), { font: '50px Arial', fill: '#ffffff' });
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

	update: function() {
		nameLabel.setText(timer.toString());
	},

	toggleSound: function() {
		game.sound.mute = ! game.sound.mute;
		this.muteButton.frame = game.sound.mute ? 1 : 0;	
	}
};
