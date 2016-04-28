var waiting = false;	
var ready = false;

$( document ).ready(function(){
	$('#join').click(function(){
		if (waiting){
			waiting = false;
			$('#join').val("Join Game");
			$('#waitingText span').text('Some random text');
		}
		else{
			waiting = true;
			$('#join').val("Stop Waiting");
			$('#waitingText span').text('Waiting');
		}
	}); 
	$('#start').click(function(){
		ready = true;
		$.post("http://localhost:3000/enter",{ready:ready},function(data){        
			if(data==='done')           
				{
					window.location.href="/game";
				}
		});
	});
});

