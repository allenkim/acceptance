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

socket.on('enter game', function(){
    window.location.href="/game";
});

socket.on('update waiting', function(data){
    $('#waitingText span').text('Waiting for ' + data.numPlayersWaitingFor + ' more ' + ((data.numPlayersWaitingFor == 1) ? 'player...' : ' players...'));
});
