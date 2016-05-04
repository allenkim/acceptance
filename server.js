var ejs = require('ejs');
var express = require('express');
var cors = require('cors');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Variables to keep track of player count
var MAX_NUM_PLAYERS = 2;
var playersWaiting = [];
var playersInGame = [];
var resistanceorspy = [1,0,1,0,1]; // 0 means spy 1 means resistance

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

// Set the parameters
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set("view options", { layout: false });
app.set('port', 3000);  
app.set('ipaddr', "127.0.0.1");
app.use(express.static(__dirname + '/public'));

// Sessions allow us to verify if users can join the game
app.use(session({
    name: 'server-session-name',
    secret: 'my express secret',
    saveUninitialized: true,
    resave: true,
}));

app.use(cors());

// Body parser allows us to read the body from the POST request from client`
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.engine('html', ejs.renderFile);

// sessionToSockets is a map from a session ID to an array of socket IDs
// socketToSession is a map from socket ID to session ID
var sessionToSockets = {};
var socketToSession = {};

app.get('/', function(req, res, next){
    if (typeof req.session.ready === 'undefined') {
        req.session.ready = false;
    }
    return res.render('index.html');
});

// This POST is called when the client first connects with their socket
// This updates the maps of sessions and sockets
app.post('/connect',function(req,res,next){
    var sessID = req.sessionID;
    var socketID = req.body.socketID;
    socketToSession[socketID] = sessID;
    if (sessID in sessionToSockets){
        sessionToSockets[sessID].push(socketID);
    }
    else{
        sessionToSockets[sessID] = [socketID];
    }
    res.end('done');
});

// This POST is called when the client is entering the game
app.post('/enter',function(req,res,next){
    req.session.ready = req.body.ready;
    res.end('done');
});

// A client can only join the game if they are ready, meaning they have waited and the players have filled up
// and if they are part of the approved sessionIDs
app.get('/game', function(req, res, next){

    // ---- THESE ARE COMMENTED FOR BUILDING PURPOSES ------
    if (req.session.ready){
        req.session.ready = false;
        res.render('game.html');
    }
    else{
        res.send('You are not authorized to join the game!');
    }
    // ---- THESE ARE COMMENTED FOR BUILDING PURPOSES ------

});

io.on('connection', function(socket){
    console.log('user ' +  socket.id + ' connected');
    socket.emit('connect');
    socket.on('waiting', function(){
        var sessID = socketToSession[socket.id];
        var waitingAllowed = true;
        for (var i = 0; i < playersWaiting.length; i++){
            if (socketToSession[playersWaiting[i]] == sessID){
                waitingAllowed = false;
                break;
            }
        }
        if (waitingAllowed){
            playersWaiting.push(socket.id);

            if (playersWaiting.length == MAX_NUM_PLAYERS){
                playersWaiting.forEach(function(id){
                    io.to(id).emit('enter game');
                });
            }
            else{
                playersWaiting.forEach(function(id){
                    io.to(id).emit('update waiting', {numPlayersWaitingFor: MAX_NUM_PLAYERS - playersWaiting.length, waitingAllowed: waitingAllowed});	
                });	
            }
        }
        else{
            io.to(socket.id).emit('update waiting', {numPlayersWaitingFor: MAX_NUM_PLAYERS - playersWaiting.length, waitingAllowed: waitingAllowed});	
        }
    });

    socket.on('stop waiting', function(){
        var idx = playersWaiting.indexOf(socket.id);
        if (idx != -1){
            playersWaiting.splice(idx,1);
            playersWaiting.forEach(function(id){
                io.to(id).emit('update waiting', {numPlayersWaitingFor: MAX_NUM_PLAYERS - playersWaiting.length, waitingAllowed: true});
            });
        }
    });

    socket.on('gamestart', function(){
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
        }
    });

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    socket.on('StartTimer', function(msg) {
        console.log('Timer Started');
        var num = msg;
        var iid = setInterval(function() {
            num = num - 5;
            io.emit('timerval', num);
            if (num == 0) {
                clearInterval(iid);
            }
        }, 5000);
    });

    socket.on('disconnect',function(){
        console.log('user ' + socket.id + ' disconnected');
        var idx = playersWaiting.indexOf(socket.id);
        if (idx != -1)
            playersWaiting.splice(idx,1);
        var sessID = socketToSession[socket.id];
        delete socketToSession[socket.id];
        if (sessID in sessionToSockets){
            var sockIdx = sessionToSockets[sessID].indexOf(socket.id);
            if (sockIdx != -1)
                sessionToSockets[sessID].splice(sockIdx,1);
        }

    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
