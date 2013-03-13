var fs = require('fs');

function timestamp() {
  var d = new Date();
  return ''+d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + '.' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

exports.log = function(log_file) {

  var logstream = fs.createWriteStream(log_file, {'flags': 'a'});

  return function(tag, str) {
    str = str.replace(/^\s+|\s+$/g,'');
    if (str == "") { return; }
    var messages = str.split(/(\r?\n)+/);
    var t = timestamp();
    for (i in messages) {
      var message = messages[i].replace(/^\s+|\s+$/g,'');
      if (message != "") {
        var l = timestamp() +': ['+tag+'] ' + message;
        logstream.write(l.replace(/\n+/,'')+"\n");
        console.log(l);
      }
    }
  }

}