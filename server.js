var ejs = require('ejs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Set the parameters
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set("view options", { layout: false });
app.set('port', 3000);  
app.set('ipaddr', "127.0.0.1");
app.use(express.static(__dirname + '/public'));

app.engine('html', ejs.renderFile);

// Fischer-Yates Algorithm for shuffling an array - https://www.kirupa.com/html5/shuffling_array_js.htm
Array.prototype.shuffle = function() {
    var input = this;
    for (var i = 0; i < input.length; i++) {
        var randomindex = Math.floor(Math.random()*(input.length + 1));
        var temp = input[randomindex];
        input[randomindex] = input[i];
        input[i] = temp;
    }
    return input;
}

var MAX_NUM_PLAYERS = 5;
var numPlayersEntered = MAX_NUM_PLAYERS;

app.get('/', function(req, res){
    return res.render('index.html');
});

// A client can only join the game if they are ready, meaning they have waited and the players have filled up
// and if they are part of the approved sessionIDs
app.get('/game', function(req, res, next){

    // ---- THESE ARE COMMENTED FOR BUILDING PURPOSES ------
        if (numPlayersEntered < MAX_NUM_PLAYERS){
            res.render('game.html');
            numPlayersEntered++;
        }
        else{
            res.send('You are not authorized to join the game!');
        }
   // ---- THESE ARE COMMENTED FOR BUILDING PURPOSES ------

});

// Variables to keep track of player count
var playersWaiting = [];
var playersInGame = [];
var resistanceorspy = [1,0,1,0,1]; // 0 means spy 1 means resistance
var numpeople = [2,3,2,3,3];
var numpeoplecounter = 0;
var roundnumber = -1;
var missionresult = [];
var capindex;

// voting related variables
var voteResults = []; //indices of players to bool of voting result

var numTimerCalled = 0; //this is used for keeping track of the number of clients trying to start timer
var TIME_FOR_CONNECTION = 15; //15 seconds to connect before people get kicked out

var accumulator = 0;
var finalteam = [];

io.on('connection', function(socket){
    console.log('user ' +  socket.id + ' connected');
    socket.on('waiting', function(){
        playersWaiting.push(socket.id);

        if (playersWaiting.length == MAX_NUM_PLAYERS){
            numPlayersEntered = 0;
            playersWaiting.forEach(function(id){
                io.to(id).emit('enter game');
            });
            timerInUse = true;
            var iid = setInterval(function() {
                if (playersInGame.length < MAX_NUM_PLAYERS) {
                    timerinUse = false;
                    playersInGame.forEach(function(id){
                        io.to(id).emit('kick out');
                    });
                }
                clearInterval(iid);
            }, TIME_FOR_CONNECTION * 1000);

        }
        else{
            playersWaiting.forEach(function(id){
                io.to(id).emit('update waiting', {numPlayersWaitingFor: MAX_NUM_PLAYERS - playersWaiting.length});	
            });	
        }
    });

    socket.on('stop waiting', function(){
        var idx = playersWaiting.indexOf(socket.id);
        if (idx != -1){
            playersWaiting.splice(idx,1);
            playersWaiting.forEach(function(id){
                io.to(id).emit('update waiting', {numPlayersWaitingFor: MAX_NUM_PLAYERS - playersWaiting.length});
            });
        }
    });

    socket.on('game start', function(){
        playersInGame.push(socket.id);
        console.log('Sanity Check 1-5 - ' + socket.id);
        if (playersInGame.length == MAX_NUM_PLAYERS) {
            console.log('Sanity Check 2');
            for (var i = 0 ; i < MAX_NUM_PLAYERS; i++) {
                console.log('Sanity Check 1 - ' + playersInGame[i]);
                io.to(playersInGame[i]).emit('index', i);
                io.to(playersInGame[i]).emit('r_or_s', resistanceorspy[i]);
                if (resistanceorspy[i] == 0) {
                    io.to(playersInGame[i]).emit('spyinfo', resistanceorspy);
                }
            }	 
            playersInGame.forEach(function(id){
                io.to(id).emit('connection complete');
            });
        }
    });

    socket.on('round start', function() {
        console.log(accumulator);
        accumulator++;
        teamchosen = [];

        if (accumulator >= MAX_NUM_PLAYERS) {
            roundnumber++;
            capindex = roundnumber % MAX_NUM_PLAYERS;
            io.emit('captain', capindex);
            capindex = capindex + 1;
            var rn = roundnumber + 1; 
            io.emit('chat message', ['Round ' + rn + ' has begun!', 'Server']);
            io.emit('chat message', ['Captain is player ' + capindex + '!' , 'Server']); 
            accumulator = 0;
        }
        
    });

    socket.on('team_choose', function(){
        var temp = numpeople[numpeoplecounter];
        // numpeoplecounter++ only when team selection is successful
        accumulator++;
        console.log('a - ' + accumulator);
        if (accumulator >= MAX_NUM_PLAYERS) {
            io.to(playersInGame[roundnumber % MAX_NUM_PLAYERS]).emit('numteam', temp);
            io.emit('chat message', ['Captain please choose ' + temp + ' players for your team!', 'Server']);
            io.emit('chat message', ['Use CTRL key to switch between blue boxes', 'Server']);
            accumulator = 0;
        }
    });

    socket.on('boxchosen', function(msg) {
        for (var i = 0; i < MAX_NUM_PLAYERS; i++) {
            if (playersInGame[i] != socket.id) {
                io.to(playersInGame[i]).emit('bcs', msg);
            }
        }
    });

    socket.on('teamchosen', function(msg) {
        for (var i = 0; i < MAX_NUM_PLAYERS; i++) {
            if (playersInGame[i] != socket.id) {
                io.to(playersInGame[i]).emit('tcs', msg);
            }
        }
    });

    socket.on('finalteamchosen', function(msg) {
        console.log(msg);
        finalteam = msg;
        io.emit('nextState');
    });

    socket.on('team vote', function(data){
        var idx = data.idx;
        var approved = data.approved;
        if (approved)
            voteResults[idx] = true;
        else
            voteResults[idx] = false;
        accumulator++;
        if (accumulator == MAX_NUM_PLAYERS){
            var numApproved = 0;
            for (var i = 0; i < MAX_NUM_PLAYERS; i++){
                if (voteResults[i])
                    numApproved++;
            }
            var approved = false;
            if (numApproved > (MAX_NUM_PLAYERS / 2))
                approved = true;
            playersInGame.forEach(function(id){
                io.to(id).emit('team voting result', {voteResult: approved, voteData: voteResults});
            });
            accumulator = 0;
        }
    });

    socket.on('missionstart', function() {
        accumulator++;
        if (accumulator >= MAX_NUM_PLAYERS) {
            accumulator = 0;
            io.emit('chat message', ['Team members, complete the mission!', 'Server']);
            for (var i = 0; i < finalteam.length; i++) {
                io.to(playersInGame[finalteam[i]]).emit('domission');
            }
        }

    });

    socket.on('missionchosen', function(res) {
        missionresult.push(res);
        if (missionresult.length >= MAX_NUM_PLAYERS) {
            var result = true;
            for (var i = 0; i < missionresult.length; i++) {
                if (missionresult[i] == 0) { 
                    result = false;
                    break;
                }
            }
            var mes = (result) ? ('Success') : ('Failure');
            io.emit('chat message', ['Mission Result was ' + mes + '!', 'Server']);
            io.emit('missionresult', result);
            numpeoplecounter++;
        }
    });

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    socket.on('start timer', function(msg) {
        console.log('Timer Started');
        var num = msg;
        numTimerCalled++;
        if (numTimerCalled == MAX_NUM_PLAYERS){
            playersInGame.forEach(function(id){
                io.to(id).emit('start local timer', num);
            });
            numTimerCalled = 0;
            var iid = setInterval(function() {
                num = num - 5;
                io.emit('update time', num);
                if (num <= 0) {
                    playersInGame.forEach(function(id){
                        console.log('emitted nextstate');
                        io.to(id).emit('nextState');
                    });
                    clearInterval(iid);
                }
            }, 5000);
        }
    });

    socket.on('updatetable', function() {
        accumulator++;

        if (accumulator == MAX_NUM_PLAYERS) {
            datatable = {
                1: [true, false, false],
                2: [true, false, false],
                3: [true, false, false],
                4: [true, false, false],
                5: [true, false, false],
                6: false,
                7: 'Null'
            };

            // Include Captain
            datatable[capindex][2] = true;

            var temp = 0;
            // Include Vote Result
            for (var i = 0; i < voteResults.length; i++) {
                datatable[i+1][0] = voteResults[i];
                if (voteResults[i] == true) { temp++; }
            }

            // Include Team
            console.log(finalteam);
            for (var i = 0; i < finalteam.length; i++) {
                datatable[finalteam[i] + 1][1] = true;
            }

            if (temp > (MAX_NUM_PLAYERS / 2)) {
                datatable[6] = true;
                if (missionresult != []) {
                    datatable[7] = 'Resistance';
                    console.log(missionresult);
                    for (var i = 0; i < missionresult.length; i++) {
                        if (missionresult[i] == 0) { datatable[7] = 'Spies'; }
                    }
                    missionresult = [];
                }
            }

            console.log(datatable);
            io.emit('datatable', datatable);
            accumulator = 0;
        }
    });

    socket.on('disconnect',function(){
        console.log('user ' + socket.id + ' disconnected');
        var idx = playersWaiting.indexOf(socket.id);
        if (idx != -1)
            playersWaiting.splice(idx,1);
        idx = playersInGame.indexOf(socket.id);
        if (idx != -1){
            playersInGame.forEach(function(id){
                io.to(id).emit('kick out');
            });
        }
        playersInGame = [];
        playersWaiting = [];
        accumulator = 0;
        numpeoplecounter = 0;
        roundnumber = -1;
        missionresult = [];
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
