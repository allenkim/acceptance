// get kicked out since all players couldn't connect in 15 seconds
// can also get kicked out if someone disconnects in game
socket.on('kick out', function(){
    window.location.href="/";
});

// Index 
var index = -1;
socket.on('index', function(num) {
	console.log(num);
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


var setup_players = false;
players = [];
playertext = [];
playerdata = new Map();
playerdata.set('size', [50, 50]);
playerdata.set('positions', [[150, 200], [50, 135], [100, 60], [200, 60], [250, 135]]);
playerdata.set('index-x-offset', 35);
playerdata.set('turn', 3);

// Timer update variables
var timer; //holds actual time for client
var timerText; //this is the phaser object that represents the text on display

socket.on('update time', function(num) {
	timer = num;
});

socket.on('start local timer', function(num){
    localTimer(num);
});


function ezTimer(timeDuration){
    socket.emit('start timer', timeDuration);	
};

function localTimer(timeDuration){
    timer = timeDuration;
    var id = setInterval(function() { 
        timer = timer - 1; 
        timerText.text = timer;
        if (timer <= 0) {
            nextState();
            clearInterval(id); 
        } 
    }, 1000);
};

var gameStates = {
    GAME_SETUP: 1,
    CAPTAIN_SELECTION: 2,
    TEAM_SELECTON: 3,
    VOTE: 4,
    SHOW_VOTE: 5,
    DO_MISSION: 6,
    SHOW_RESULTS: 7
};
Object.freeze(gameStates);

// map of whether the code in each state was run already
var alreadyRan = false;

var currentState = gameStates.GAME_SETUP;
var currentStateText;

socket.on('connection complete', function(){
    nextState();
});

function nextState(){
    currentState = (currentState == 7) ? 1 : currentState + 1;
    alreadyRan = false;
};

var playState = {
	create: function() { 
		socket.emit('game start');

		currentStateText = game.add.text(game.world.centerX, 30, 'Waiting for players to connect', { font: '50px Arial', fill: '#ffffff' });
		currentStateText.anchor.setTo(0.5, 0.5);

		music = game.add.audio('music');

    	music.play();

		// Add a mute button
		this.muteButton = game.add.button(0, 0, 'mute', this.toggleSound, this);
		this.muteButton.input.useHandCursor = true;
		if (game.sound.mute) {
			this.muteButton.frame = 1;
		}

        timerText = game.add.text(game.world.centerX,game.world.centerY, "", {font: "32px Arial", fill: "#FFFFFF" });
        timerText.anchor.setTo(0.5,0.5);
	},

	update: function() {
        console.log(currentState);
        if (currentState == gameStates.GAME_SETUP){
            if (index != -1 && res_or_spy != -1 && spyinfo != [] && setup_players == false) {
                for (var i = 0 ; i < playerdata.get('positions').length; i++) {
                    var spritekey = 'u';
                    var temp = ((index + i) % 5);
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
                    temp++;
                    players.push( game.add.sprite(playerdata.get('positions')[i][0], playerdata.get('positions')[i][1], spritekey) );
                    playertext.push( game.add.text(playerdata.get('positions')[i][0] - playerdata.get('index-x-offset'), playerdata.get('positions')[i][1], temp, { font: '20px Arial', fill: '#ffffff' }) );
                    players[i].anchor.setTo(0.5, 0.5);
                    playertext[i].anchor.setTo(0.5, 0.5);
                    players[i].width = playerdata.get('size')[0];
                    players[i].height = playerdata.get('size')[1];
                }
                setup_players = true;
                timerText.text = "";
            }
        }
        else if (currentState == gameStates.CAPTAIN_SELECTION){
            console.log(alreadyRan);
            if (!alreadyRan){
                currentStateText.text = "Captain Selection Phase";
                ezTimer(5);
                alreadyRan = true;
            }
        }
        else if (currentState == gameStates.TEAM_SELECTION){
            console.log(alreadyRan);
            if (!alreadyRan){
                currentStateText.text = "Team Selection Phase";
                ezTimer(5);
                alreadyRan = true;
            }
        }
        else if (currentState == gameStates.VOTE){
            if (!alreadyRan){
                currentStateText.text = "Voting Phase";
                ezTimer(5);
                alreadyRan = true;
            }

        }
        else if (currentState == gameStates.DO_MISSION){
            if (!alreadyRan){
                currentStateText.text = "Mission Time";
                ezTimer(5);
                alreadyRan = true;
            }
        }
        else if (currentState == gameStates.SHOW_RESULTS){
            if (!alreadyRan){
                currentStateText.text = "Results";
                ezTimer(5);
                alreadyRan = true;
            }
        }
	},

	toggleSound: function() {
		game.sound.mute = ! game.sound.mute;
		this.muteButton.frame = game.sound.mute ? 1 : 0;	
	}
};
