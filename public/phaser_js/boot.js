// Our initial boot state
var bootState = {

	preload: function () {
		// We need some progress bar at first

		game.stage.disableVisibilityChange = true;
		game.load.image('progressBar', 'assets/progressBar.png');

	},

	create: function() { 
		// Set an optional background color
		// game.stage.backgroundColor = '#3498db';

		game.state.start('load');
	}
};
