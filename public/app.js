function set_status(now) {
	var url = '/status?wait';
	if (now) {
		url = '/status';
	}

	$.ajax({
		type: 'GET',
		url: url,
		dataType: 'json',
		success: function(data){
			if (data.state == "idle") {
				$('#status').html("Idle");
			}
			if (data.state == "playing") {
				var media = "";
				if (data.currentMedia[0] == "/") {
					parts = data.currentMedia.split("/");
					media = parts[parts.length-1];
				} else {
					media = data.currentMedia;
				}
				$('#status').html("Playing "+media);
			}
			set_status(false);
		},
		error: function() {
			// On error wait 10sec before next request
			$('#status').html("Status Request Error");
			setTimeout(function() {set_status(false);}, 10000);
		}
	});
}

set_status(true);

function send_cmd(cmd) {
	var url = '/cmd?'+cmd;
	$.ajax({
		type: 'GET',
		url: url
	});
}

var term = $('#terminal');

term.on('keyup', function(ev) {

	// If the key is ` make sure it doesnt bubble up to the document
	if (ev.keyCode == 192) {
		ev.stopPropagation();
		return;
	}

	// If the key is ` make sure it doesnt bubble up to the document
	if (ev.keyCode == 192) {
		ev.stopPropagation();
		return;
	}

	// Submit the command if enter is pressed
	if (ev.keyCode == 13) {
		var v = term.val();
		if (v === "") return;

		if (v == "?") {
			window.open("http://www.mplayerhq.hu/DOCS/tech/slave.txt", 'cmdHelp');
		} else if (v !== '') {
			send_cmd(v);
		}

		term.val('');
	}
});

$(document).on('keyup', function(ev) {
	// If the key was `
	if (ev.keyCode == 192) {
		ev.preventDefault();
		term.toggle();
		term.focus();
	}

	// Hide if escape is pressed
	if (ev.keyCode == 27) {
		ev.preventDefault();
		term.blur();
		term.hide();
	}
});

