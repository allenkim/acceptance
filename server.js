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

app.get('/', function(req, res){
  res.render('index.html');
});


app.get('/game', function(req, res){
  res.render('game.html');
});


io.on('connection', function(socket){
	console.log('a user connected');

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

	socket.on('disconnect',function(){
		console.log('a user disconnected');
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
