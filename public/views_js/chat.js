// Chat
$( document ).ready(function() {

	$('form').submit(function(){
		var temp = index+1;
		message = [ $('#m').val(), 'Player ' + temp.toString() ];
		socket.emit('chat message', message);
		$('#m').val('');
		return false;
	})

});


socket.on('chat message', function(themsg){
	$('#messages').append(
	'<li><b>' + themsg[1] + ':</b>  ' + themsg[0] + '</li>'
	);
	$('#messagespace').scrollTop(document.getElementById("messagespace").scrollHeight);
});