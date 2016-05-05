// Timer update variables
var timer;
socket.on('timerval', function(num) {
	console.log(num);
	timer = num;
});

// get kicked out since all players couldn't connect in 15 seconds
socket.on('kick out', function(){
    window.location.href="/";pmm
});

// Index 
var index = -1;
socket.on('index', function(num) {
	index = num;
});

// Resistance or spy
var res_or_spy = -1;
socket.on('r_or_s', function(num) {
	res_or_spy = num;
});

// spyinfo
var spyinfo = [];
socket.on('spyinfo', function(array) {
	spyinfo = array;
});

var captain = -1;
var captainsprite = null;
var captaindraw = false;
socket.on('captain', function(num) {
	captain = num;
});

var setup_players = false;
players = [];
playertext = [];
playerdata = new Map();
playerdata.set('size', [50, 50]);
playerdata.set('positions', [[150, 200], [50, 135], [100, 60], [200, 60], [250, 135]]);
playerdata.set('index-x-offset', 35);
playerdata.set('turn', 3);

var timer_text;
function eztimer(timeDuration, func){
    timer = timeDuration;
    socket.emit('StartTimer', timer);	
    var id = setInterval(function() { 
        timer = timer - 1; 
        timer_text.text = timer;
        if (timer <= 0) { func(); clearInterval(id); } 
    }, 1000);
}

var playState = {
	create: function() { 
		socket.emit('game start');

		nameLabel = game.add.text(game.world.centerX, 10, 'Acceptance', { font: '20px Arial', fill: '#ffffff' });
		nameLabel.anchor.setTo(0.5, 0.5);

		music = game.add.audio('music');

    	music.play();

		// Add a mute button
		this.muteButton = game.add.button(0, 0, 'mute', this.toggleSound, this);
		this.muteButton.input.useHandCursor = true;
		if (game.sound.mute) {
			this.muteButton.frame = 1;
		}

        // Display Timer
        //timer_text = game.add.text(game.world.centerX,game.world.centerY, timer, {font: "32px Arial", fill: "#FFFFFF" });
		//eztimer(20);
	},

	update: function() {
		if (index != -1 && res_or_spy != -1 && spyinfo != [] && setup_players == false) {
			socket.emit('round start');
			for (var i = 0 ; i < playerdata.get('positions').length; i++) {
				var spritekey = 'u';
				var temp = ((index + i) % 5);
				var actual_index_offset = -(playerdata.get('index-x-offset'));
				if(res_or_spy == 0) {
					if(spyinfo[temp] == 0) {
						spritekey = 's'; 
					}
					else {
						spritekey = 'r'; 
					}
					if (i >= playerdata.get('turn')) {
						spritekey += '2';
					}
				}
				else {
					if (i == 0) { spritekey = 'r'; }
				}
				if (i >= playerdata.get('turn')) {
						actual_index_offset = playerdata.get('index-x-offset');
				}
				temp++;
				players.push( game.add.sprite(playerdata.get('positions')[i][0], playerdata.get('positions')[i][1], spritekey) );
				playertext.push( game.add.text(playerdata.get('positions')[i][0] + actual_index_offset, playerdata.get('positions')[i][1], temp, { font: '20px Arial', fill: '#ffffff' }) );
				players[i].anchor.setTo(0.5, 0.5);
				playertext[i].anchor.setTo(0.5, 0.5);
				players[i].width = playerdata.get('size')[0];
				players[i].height = playerdata.get('size')[1];
			}
			setup_players = true;
		}

		if ((captain != -1) && (captaindraw == false)) {
			var actual_index_offset = -(playerdata.get('index-x-offset'));
			console.log(captain);
			var temp = captain - index;
			console.log(temp);
			if (temp < 0) { temp += 5; }
			console.log(temp);
			if (temp >= playerdata.get('turn')) {
				actual_index_offset = playerdata.get('index-x-offset');
			}
			captainsprite = game.add.sprite(playerdata.get('positions')[temp][0] - actual_index_offset, playerdata.get('positions')[temp][1], 'c');
			captainsprite.anchor.setTo(0.5, 0.5);
			captainsprite.width = 30;
			captainsprite.height = 30;
			captaindraw = true;
		}
	},

	toggleSound: function() {
		game.sound.mute = ! game.sound.mute;
		this.muteButton.frame = game.sound.mute ? 1 : 0;	
	}
};
