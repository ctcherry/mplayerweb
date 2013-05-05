var config = require('./../config');
var log = require('./log').log(config.log_file);
var fs = require('fs');
var util = require('util');
var spawn = require('child_process').spawn;
var _ = require('underscore')._;

exports.MPlayer = function() {

  var _state = "off";
  var _current_media = "";
  var _stateListeners = [];
  var _self = this;
  var _startTime = 0;

  this.state = function() {
    return _state;
  };

  this.status = function () {
    return {state: _state, currentMedia: _current_media};
  };

  var set_state = function(new_state) {
    _state = new_state;
    notifyStateListeners();
  };

  this.addStateListener = function(func) {
    _stateListeners.push(func);
  };

  var notifyStateListeners = function() {
    current_state = _state;
    log('server', "Status: (state: "+_state+", current media: '"+_current_media+"')");
    _.each(_stateListeners, function(listener) {
      listener(current_state);
    });
  };

  var set_state_from_log = function(s) {
    // This let's us know if the file has ended, or has been stopped
    if (s.indexOf("EOF code:") > -1) {
      _current_media = '';
      _state = "idle";
      notifyStateListeners();
    }

    // This shows up right when we send a file to be played, it's not actually
    // playing yet
    if (s.indexOf("Playing ") > -1) {
      var p_matches = s.match(/Playing\s(.+?)\.\s/);
      _current_media = p_matches[1];
      _state = "attempting_play";
      notifyStateListeners();
    }

    // If we are playing an Icecast stream, well get extra info, set that
    if (s.indexOf("ICY Info: StreamTitle=") > -1) {
      var icy_matches = s.match(/ICY\sInfo:\sStreamTitle=[\'\"](.+?)[\'\"];/);
      _current_media = icy_matches[1];
      notifyStateListeners();
    }


    // Check if we actually started playing something
    if (s.indexOf("Starting playback...") > -1) {
      _state = "playing";
      notifyStateListeners();
    }
  };

  var load_mplayer = function() {
    log('server', 'Spawning mplayer ['+config.mplayer_path+']...');
    _startTime = new Date().getTime();
    // The msglevel options set the right logging levels to print out to
    // detect when playback has started ("Starting playback..") and when a
    // file has ended ("EOF code:")
    _self.instance = spawn(config.mplayer_path, ['-msglevel', 'global=6', '-msglevel', 'cplayer=4', '-idle', '-slave', '-quiet']);
    _state = "idle";
    notifyStateListeners();
    log('server', 'mplayer child pid: ' + _self.instance.pid);

    _self.instance.stdout.on('data', function(data) {
      var s = data.toString();
      log('mplayer', s);
      set_state_from_log(s);
    });

    _self.instance.on('exit', function (){
      var t = new Date().getTime();
      var dt = t - _startTime;
      if (dt < 3000) {
        // Process is erroring too close to start up, abort.
        log('server', 'mplayer is failing to start, terminating.');
        process.exit(1);
      }
      _current_media = "";
      _state = 'off';
      notifyStateListeners();
      load_mplayer();
    });
  };

  load_mplayer();

  this.send = function(cmd) {
    log('server', "Sending command to mplayer: '"+cmd+"\\n'");
    this.instance.stdin.write(cmd+"\n");
  };

  this.play = function(path) {
    this.send("loadfile \""+path+"\"");
  };

  this.play_list = function(path) {
    this.send("loadlist \""+path+"\"");
  };

  this.stop = function(path) {
    this.send("stop");
  };

};