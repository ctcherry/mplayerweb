var http = require('http');

exports.stations = (function(){

  var _stations = [];

  var _get_stations = function(ext_callback) {
    if (_stations.length > 0) {
      ext_callback(_stations);
      return true;
    }

    var options = {
      host: 'www.di.fm',
      path: '/'
    };

    function matchAll(string, regex) {
      var matches = []
      while (match = regex.exec(string)) {
        var tmp = [];
        for (var i=1; i < match.length; i++) {
          tmp.push(match[i]);
        }
        matches.push(tmp);
      }
      return matches;
    }

    var _callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      var parse_regex = /\t{5}<a href="#">([^<]+?)<\/a>[\s\S]+?(http:.+public3.+\.pls)+/ig;

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        _stations = matchAll(str, parse_regex)
        ext_callback(_stations);
      });
    }

    http.request(options, _callback).end();
  }

  return function(callback) {
    _get_stations(callback);
  }

})();