// Initialize Phaser
var boxWidth = $("#Box1").width();
var boxHeight = $("#Box1").height();

var game = new Phaser.Game(boxWidth, boxHeight, Phaser.CANVAS, 'gameDiv');

// A 'global' variable that everyone could see
game.global = {
	score: 0, // as an example
	// Add other global variables
};

// Define states
game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('play', playState);

// Start the "boot" state
game.state.start('boot');
