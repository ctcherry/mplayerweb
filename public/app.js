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