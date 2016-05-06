// get kicked out since all players couldn't connect in 15 seconds
// can also get kicked out if someone disconnects in game
socket.on('kick out', function(){
    window.location.href="/";
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
var prevcaptain = -1;
var captainsprite = null;
var captaindraw = false;
socket.on('captain', function(num) {
	console.log(num);
	captain = num;
});

var setup_players = false;
players = [];
playertext = [];
playerrects = [];
playerdata = new Map();
playerdata.set('size', [50, 50]);
playerdata.set('rect-size', [80, 60]);
playerdata.set('positions', [[300, 280], [150, 180], [225, 80], [375, 80], [450, 180]]);
playerdata.set('rect-positions', [[248,250],[98,150],[173,50],[348,50],[423,150]]);
playerdata.set('index-x-offset', 40);
playerdata.set('turn', 3);

socket.on('numteam', function(nt) {
	teamnum = nt;
});

var teamnum = -1;
var teamchosen = [];
var boxchosen = -1;
var filldefaultteam = false;

socket.on('tcs', function(msg){
	var temp = [];
	for (var i = 0; i < msg.length; i++) {
		temp.push(playerindex2position(msg[i], index));
	}
 	teamchosen = temp;
});

socket.on('bcs', function(msg){
	boxchosen = msg;
});


// Timer update variables
var timer; //holds actual time for client
var timerText; //this is the phaser object that represents the text on display 

socket.on('update time', function(num) {
	timer = num;
});

socket.on('start local timer', function(time){
    localTimer(time);
});

var domission;
var setupmissionsprites;
var success;
var fail;
var successmissionrect;
var failmissionrect;
var missionchosen = -1;
socket.on('domission', function() {
    domission = true;
});

var missionresult = -1;

socket.on('missionresult', function(bool){
    if (bool) {
        missionresult = 1;
    }
    else {
        missionresult = 0;
    }
});


function playerindex2position(other_index, you_index) {
	var temporary = other_index - you_index;
	if (temporary < 0) { temporary += 5; }
	return temporary;
}

function position2playerindex(other_position, you_index) {
	return ((other_position + you_index) % 5);
}


function ezTimer(timeDuration){
    timerText.text = timeDuration;
    socket.emit('start timer', timeDuration);	
};

function localTimer(timeDuration){
    timer = timeDuration;
    var id = setInterval(function() { 
        timer = timer - 1; 
        timerText.text = timer;
        if (timer <= 0) {
            if (currentState == gameStates.VOTE && !voted)
                approveTeam();
            clearInterval(id);
        } 
    }, 1000);
};

function submitevent() {
	submit.destroy();
	var temp = [];
	for (var i = 0; i < teamchosen.length; i++) {
		temp.push(position2playerindex(teamchosen[i], index));
	}
    socket.emit('finalteamchosen', temp);
}

// Voting related stuff here
var playerVote = true;
var teamVoteApproved = false;
var approve; //phaser images
var reject; //phaser images
var voted = false;

function approveTeam(){
    console.log("Approve!");
    approve.visible = false;
    reject.visible = false;
    voted = true;
    socket.emit('team vote',{idx: index, approved: true});
};

function rejectTeam(){
    console.log("Reject!");
    approve.visible = false;
    reject.visible = false;
    voted = true;
    socket.emit('team vote',{idx: index, approved: false});
};

socket.on('team voting result',function(data){
    var approved = data.voteResult;
    var voteData = data.voteData;
    console.log(approved);
    if (approved)
        teamVoteApproved = true;
    else
        teamVoteApproved = false;
});

var gameStates = {
    GAME_SETUP: 1,
    CAPTAIN_SELECTION: 2,
    TEAM_SELECTION: 3,
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
    var id = setInterval(function() { 
        if (setup_players) { nextState(); clearInterval(id); } 
    }, 300);
});

function nextState(){
    console.log("next state called:", currentState);
    if (currentState == gameStates.SHOW_RESULTS){
        currentState = gameStates.CAPTAIN_SELECTION;
        captaindraw = false;
    }
    else if (currentState == gameStates.SHOW_VOTE){
        if (teamVoteApproved)
            currentState = gameStates.DO_MISSION;
        else {
            currentState = gameStates.CAPTAIN_SELECTION;
            captaindraw = false;
        }
    }
    else{
        currentState++;
    }
    alreadyRan = false;
};

socket.on('nextState', function() {
    console.log("Received next state from server");
	nextState();
});

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

        timerText = game.add.text(300,180, "", {font: "20px Arial", fill: "#FFFFFF" });
        timerText.anchor.setTo(0.5,0.5);

        key1 = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
        key1down = false;

        approve = game.add.button(game.world.centerX - 200, game.world.height - 50, 'approve',approveTeam);
        approve.visible = false;
        approve.anchor.setTo(0.5,0.5);
        approve.scale.setTo(0.2,0.2);
        reject = game.add.button(game.world.centerX + 200, game.world.height - 50, 'reject', rejectTeam);
        reject.visible = false;
        reject.anchor.setTo(0.5,0.5);
        reject.scale.setTo(0.2,0.2);

        domission = false;
        setupmissionsprites = false;
        missionchosen = -1;
        successmissionrect = null;
        failmissionrect = null;

        missionresult = -1;
	},

	update: function() {
        //console.log(currentState);
        if (currentState == gameStates.GAME_SETUP){
            if (index != -1 && res_or_spy != -1 && spyinfo != [] && setup_players == false) {
                for (var i = 0 ; i < playerdata.get('positions').length; i++) {
                    var spritekey = 'u';
                    var temp = position2playerindex(i, index);
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
                    playerrects.push( new Phaser.Rectangle(playerdata.get('rect-positions')[i][0], playerdata.get('rect-positions')[i][1], playerdata.get('rect-size')[0], playerdata.get('rect-size')[1]));
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
            if (!alreadyRan){
                currentStateText.text = "Captain Selection Phase";
                socket.emit('round start');
                ezTimer(5);
                alreadyRan = true;
            }
            else if ((captain != prevcaptain) && (captaindraw == false)) {
            	prevcaptain = captain;
				var actual_index_offset = -(playerdata.get('index-x-offset'));
				var temp = playerindex2position(captain, index);
				if (temp >= playerdata.get('turn')) {
					actual_index_offset = playerdata.get('index-x-offset');
				}
				if (captainsprite != null) { captainsprite.destroy(); }
				captainsprite = game.add.sprite(playerdata.get('positions')[temp][0] - actual_index_offset, playerdata.get('positions')[temp][1], 'c');
				captainsprite.anchor.setTo(0.5, 0.5);
				captainsprite.width = 30;
				captainsprite.height = 30;
				captaindraw = true;
			}	
        }
        else if (currentState == gameStates.TEAM_SELECTION){
            if (!alreadyRan){
            	teamnum = -1;
				teamchosen = [];
				boxchosen = -1;
				filldefaultteam = false;

                currentStateText.text = "Team Selection Phase";
                socket.emit('team_choose');
                //ezTimer(5);
                alreadyRan = true;
            }
            // teamnum is number of people in team - only captain gets to know that - used to separate captain logic from other player logic
            if (teamnum != -1) {
            	timerText.text="";
            	if (filldefaultteam == false) {
            		
            		submit = game.add.sprite(300,180,'submit');
            		submit.anchor.setTo(0.5,0.5);
            		submit.width = 80;
            		submit.height = 40;
            		submit.inputEnabled = true;

            		submit.events.onInputDown.add(submitevent, this);

            		for (var i = 0 ; i < teamnum; i++) {
            			teamchosen.push(i);
            		}
            		boxchosen = 0;

            		var tcs = [];
            		for (var j = 0; j < teamnum; j++) {
            			tcs.push(position2playerindex(teamchosen[j], index));
            		}
            		socket.emit('teamchosen', tcs);
            		socket.emit('boxchosen', boxchosen);
            		filldefaultteam = true;
            	}
            	else {
            		if (game.input.mousePointer.isDown) {
            			for (var i = 0; i < playerrects.length; i++) {
            				if (playerrects[i].contains(game.input.mousePointer.x, game.input.mousePointer.y)) {
            					var selfchoice = false;
            					for (var j = 0; j < teamnum; j++) {
            						if (teamchosen[j] == i) {selfchoice = true; } 
            					}
            					if (selfchoice == false) { 		
            						teamchosen[boxchosen] = i; 
            						
            						var tcs = [];
            						for (var j = 0; j < teamnum; j++) {
            							tcs.push(position2playerindex(teamchosen[j], index));
            						}
            						socket.emit('teamchosen', tcs);
            					}
            				}
            			}
            		}
            		else if (key1.isDown && key1down == false) {
            			boxchosen = (boxchosen + 1) % teamnum;
            			socket.emit('boxchosen', boxchosen);
            			key1down = true;
            		}
            		else if (key1.isUp && key1down) {
            			key1down = false;
            		}
            	}
            	//submit.destroy()
            	//filldefaultteam = false;
            	//teamnum = -1;
            	//nextState();
            }
            else {
            	timerText.text = "Waiting for Captain";
            }
        }
        else if (currentState == gameStates.VOTE){
            if (!alreadyRan){
                currentStateText.text = "Voting Phase";
                approve.visible = true;
                reject.visible = true;
                ezTimer(10);
                alreadyRan = true;
            }

        }
        else if (currentState == gameStates.SHOW_VOTE){
             if (!alreadyRan){
                currentStateText.text = "Voting Results";
                ezTimer(5);
                alreadyRan = true;
            }

        }
        else if (currentState == gameStates.DO_MISSION){
            if (!alreadyRan){
                currentStateText.text = "Mission Time";
                socket.emit('missionstart');
                ezTimer(15);
                alreadyRan = true;
            }

            if (domission) {
                if(setupmissionsprites == false) {
                    success = game.add.sprite(150, 280, 'success');
                    success.anchor.setTo(0.5, 0.5);
                    success.width = 100;
                    success.height = 100;
                    fail = game.add.sprite(450, 280, 'fail');
                    fail.anchor.setTo(0.5, 0.5);
                    fail.width = 100;
                    fail.height = 100;
                    successmissionrect = new Phaser.Rectangle(100, 230, 100, 100);
                    failmissionrect = new Phaser.Rectangle(400, 230, 100, 100);
                    missionchosen = 1;
                    setupmissionsprites = true;
                }
                else {
                    if (game.input.mousePointer.isDown) {
                        if ((missionchosen == 1) && failmissionrect.contains(game.input.mousePointer.x, game.input.mousePointer.y)) {
                            if (spyinfo[index] == 0) {
                                missionchosen = 0;
                            }
                        }
                        else if ((missionchosen == 0) && successmissionrect.contains(game.input.mousePointer.x, game.input.mousePointer.y)) {
                            missionchosen = 1;
                        }
                    }

                }
            }
        }
        else if (currentState == gameStates.SHOW_RESULTS){
            if (!alreadyRan){
                success.destroy();
                fail.destroy();
                successmissionrect = null;
                failmissionrect = null;
                domission = false;
                setupmissionsprites = false;
                socket.emit('missionchosen', missionchosen);
                ezTimer(10);
                alreadyRan = true;
            }
            if (missionresult != -1) {
                if (missionresult == 0) {
                     currentStateText.text = "Result - Mission Failure";
                }
                else if (missionresult == 1) {
                    currentStateText.text = "Result - Mission Success";
                }
            }
        }
	},

	render: function() {
		if (currentState >= gameStates.TEAM_SELECTION && teamchosen != [] && boxchosen != -1) {
			for (var i = 0; i < teamchosen.length; i++) {
				game.debug.geom(playerrects[teamchosen[i]], 'rgba(0, 255,255, 0.5)');
			}
			if (currentState == gameStates.TEAM_SELECTION) {
				game.debug.geom(playerrects[teamchosen[boxchosen]], 'rgba(255,0,0,0.5)');
			}
		}
        if ((currentState == gameStates.DO_MISSION) && missionchosen != -1) {
            if (missionchosen == 0) {
                game.debug.geom(failmissionrect, 'rgba(255,0,0,0.5)');
            }
            else if (missionchosen == 1) {
                game.debug.geom(successmissionrect, 'rgba(255,0,0,0.5)');
            }
        }
	},

	toggleSound: function() {
		game.sound.mute = ! game.sound.mute;
		this.muteButton.frame = game.sound.mute ? 1 : 0;	
	}
};
