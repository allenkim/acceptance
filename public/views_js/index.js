var waiting = false;	
var ready = false;
var socket = io();

$( document ).ready(function(){
	$('#join').click(function(){
		if (waiting){
			waiting = false;
			$('#join').val("Join Game");
			$('#waitingText span').text('Click the button above to join a game!');
			socket.emit('stop waiting');
		}
		else{
			waiting = true;
			$('#join').val("Stop Waiting");
			$('#waitingText span').text('Waiting');
			socket.emit('waiting');
		}
	}); 
});

socket.on('connect', function(){
	var socketID = "/#" + socket.io.engine.id;
	$.post("http://localhost:3000/connect",{socketID:socketID});
});

socket.on('enter game', function(){
	ready = true;
	$.post("http://localhost:3000/enter",{ready:ready},function(data){        
		if(data==='done')           
			{
				window.location.href="/game";
			}
	});
});

socket.on('update waiting', function(data){
	if (data.waitingAllowed)
		$('#waitingText span').text('Waiting for ' + data.numPlayersWaitingFor + ' more ' + ((data.numPlayersWaitingFor == 1) ? 'player...' : ' players...'));
	else
		$('#waitingText span').text('You are already waiting for a game in the same session!');
});
