$( document ).ready(function() {
	$('form').submit(function(){
		socket.emit('chat message', $('#m').val());
		$('#m').val('');
		return false;
	});
});


var socket = io();
var dataindex = 0;

socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
	$('#messagespace').scrollTop(document.getElementById("messagespace").scrollHeight);
});

$(document).keyup(function(e) {
	if (e.keyCode == 32) {
		if (dataindex < 3) {
			addrow(dataindex);
			dataindex++;
		}
	}
});

var data = [
	{
		// Vote, Team, Captain
		1: [true, true, true],
		2: [true, true, false],
		3: [true, false, false],
		4: [true, false, false],
		5: [false, false, false],
		6: true,
		7: 'Resistance' 
	},
	{
		// Vote, Team, Captain
		1: [true, false, false],
		2: [true, true, true],
		3: [false, true, false],
		4: [false, true, false],
		5: [true, false, false],
		6: true,
		7: 'Spies' 
	},
	{
		// Vote, Team, Captain
		1: [false, false, false],
		2: [false, true, false],
		3: [true, true, true],
		4: [false, true, false],
		5: [false, false, false],
		6: false,
		7: 'Null' 
	}
];

function addrow(i) {
	htmlstring = "";
	htmlstring += '<tr>';
	num = i+1;
	htmlstring += '<th><p>' + num + '</p></th>';

	for (var j = 1; j < 6; j++) {
		var imgfilename = '';
		if (data[i][j][1]) {
			htmlstring += '<th style="background-color: #D1E4FF">';
		}
		else {
			htmlstring +='<th>';	
		}
		
		if (data[i][j][0]) {
			imgfilename = 'yes.png';
		}
		else {
			imgfilename = 'no.png';
		}

		if (data[i][j][2]) {
			imgfilename = 'cap-' + imgfilename;
		}

		htmlstring += '<img src="assets/sprites/' + imgfilename + '" alt="a"></img></th>';
	}

	if (data[i][6]) {
		htmlstring += '<th><img src="assets/sprites/yes.png"></img></th>';
	}
	else {
		htmlstring += '<th><img src="assets/sprites/no.png"></img></th>';
	}

	if (data[i][7] == 'Resistance') {
		htmlstring += '<th style="background-color: #0246A8"></th>';
	}
	else if (data[i][7] == 'Spies') {
		htmlstring += '<th style="background-color: #A80234"></th>';
	}
	else {
		htmlstring += '<th></th>';
	}

	htmlstring += '</tr>';

	$('#table-contents').append(htmlstring); 
}

