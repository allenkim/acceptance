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

var MAX_NUM_PLAYERS = 2;
var numPlayersEntered = 0;
var gotogame = false;

app.get('/', function(req, res){
    return res.render('index.html');
});

// A client can only join the game if they are ready, meaning they have waited and the players have filled up
// and if they are part of the approved sessionIDs
app.get('/game', function(req, res, next){

    // ---- THESE ARE COMMENTED FOR BUILDING PURPOSES ------
        if ((numPlayersEntered < MAX_NUM_PLAYERS) && gotogame){
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
var roundnumber = 0;

var timerInUse = false;
var TIME_FOR_CONNECTION = 15; //15 seconds to connect before people get kicked out

var round_start_accumulator = 0;

io.on('connection', function(socket){
    console.log('user ' +  socket.id + ' connected');
    socket.on('waiting', function(){
        playersWaiting.push(socket.id);

        if (playersWaiting.length == MAX_NUM_PLAYERS){
            numPlayersEntered = 0;
            gotogame = true;
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
            console.log('Sanity Check 3');
            io.emit('chat message', ['Round 1 has begun!', 'Server']);
            io.emit('chat message', ['Captain please choose your team!', 'Server']);	 
        }
    });

    socket.on('round start', function() {

        console.log(round_start_accumulator);
        round_start_accumulator++;

        if (round_start_accumulator >= MAX_NUM_PLAYERS) {
            io.emit('captain', 3);
            roundnumber++;
            round_start_accumulator = 0;
        }
        
    });

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    socket.on('StartTimer', function(msg) {
        console.log('Timer Started');
        var num = msg;
        if (!timerInUse){
            timerInUse = true;
            var iid = setInterval(function() {
                num = num - 5;
                io.emit('timerval', num);
                if (num <= 0) {
                    clearInterval(iid);
                    timerinUse = false;
                }
            }, 5000);
        }
    });

    socket.on('disconnect',function(){
        console.log('user ' + socket.id + ' disconnected');
        var idx = playersWaiting.indexOf(socket.id);
        if (idx != -1)
            playersWaiting.splice(idx,1);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
