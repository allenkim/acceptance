// Chat
$( document ).ready(function() {

	$('form').submit(function(){
		socket.emit('chat message', $('#m').val());
		$('#m').val('');
		return false;
	})

});


socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
	$('#messagespace').scrollTop(document.getElementById("messagespace").scrollHeight);
});