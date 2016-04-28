var ejs = require('ejs');
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);

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

// Body parser allows us to read the body from the POST request from client`
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.engine('html', ejs.renderFile);

app.get('/', function(req, res){
	if (typeof req.session.ready === 'undefined') {
		req.session.ready = false;
	}
	return res.render('index.html');
});

// Accepts POST request from client
app.post('/enter',function(req,res){
	sess = req.session;
	sess.ready=req.body.ready;
	res.end('done');
});

app.get('/game', function(req, res){
	if (req.session.ready)
		res.render('game.html');
	else
		res.redirect('/');
});

io.on('connection', function(socket){
	console.log('user ' +  socket.id + ' connected');

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
