var http = require('http');

exports.stations = (function(){

  var _stations = [];

  var _get_stations = function(ext_callback) {
    if (_stations.length > 0) {
      ext_callback(_stations);
      return true;
    }

    // path can be set to one of the following:
    // /public1: AAC 64
    // /public2: AAC 32
    // /public3: MP3 96
    // /public5: WMA 40
    var options = {
      host: 'listen.di.fm',
      path: '/public1'
    };

    var _callback = function(response) {
      var json_resp = '';

      //another chunk of data has been recieved, so append it to `json_resp`
      response.on('data', function (chunk) {
        json_resp += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        _stations = JSON.parse(json_resp);
        ext_callback(_stations);
      });
    }

    http.request(options, _callback).end();
  }

  return function(callback) {
    _get_stations(callback);
  }

})();