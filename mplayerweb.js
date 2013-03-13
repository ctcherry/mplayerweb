var config = require('./config');
var log = require('./lib/log').log(config.log_file);
var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var _ = require('underscore')._;

var MPlayer = require('./lib/mplayer').MPlayer;
var MediaStore =  require('./lib/media_store').MediaStore;
var DIfm = require('./lib/difm');

var mplayer_instance = new MPlayer();
log('server', "Indexing media "+config.media_root);
var media = new MediaStore(config.media_root);

var tv_template = _.template(fs.readFileSync(path.resolve(__dirname, "templates/tv.tmpl"), "utf8"));
var movies_template = _.template(fs.readFileSync(path.resolve(__dirname, "templates/movies.tmpl"), "utf8"));
var music_template = _.template(fs.readFileSync(path.resolve(__dirname, "templates/music.tmpl"), "utf8"));

var stylesheet = fs.readFileSync(path.resolve(__dirname, "public/style.css"), "utf8");
var appjs = fs.readFileSync(path.resolve(__dirname, "public/app.js"), "utf8");

var status_requests = [];

function r_status(resp, send_now) {

  var send = function() {
    var st = mplayer_instance.status();
    var t;
    // If this reported state is short, wait 1 second before getting the state
    // because its just going to change to the next state anyway
    if (st.state == "off" || st.state == "attempting_play") {
      t = 1000;
    } else {
      t = 1;
    }
    setTimeout(function() {
      resp.writeHead(200, {'content-type':'application/json'});
      resp.end(JSON.stringify(mplayer_instance.status(), null, 2));
    }, t);
  };

  if (send_now) {
    send();
  } else {
    // Close connection in 20 seconds, just send current state
    var cancelTimer = setTimeout(function() {
      send();
    }, 20000);

    mplayer_instance.addStateListener(function() {
      clearTimeout(cancelTimer);
      send();
    });
  }

}

var s = http.createServer(function(request, resp){
    var req_url = url.parse(request.url)
    log('http', 'REQUEST: '+request.url);

    if (req_url.pathname == "/style.css") {
      resp.writeHead(200, {'content-type':'text/css'});
      resp.end(stylesheet);
      return;
    }

    if (req_url.pathname == "/app.js") {
      resp.writeHead(200, {'content-type':'text/javascript'});
      resp.end(appjs);
      return;
    }

    if (req_url.pathname == "/play") {
      if (req_url.query != "" && req_url.query != "/") {
        resp.writeHead(200, {'content-type':'text/plain'});
        f = decodeURIComponent(req_url.query.replace(/\+/g, ' '));
        mplayer_instance.play(f);
        resp.end('Playing: '+f);
      }
      return;
    }

    if (req_url.pathname == "/play/list") {
      if (req_url.query != "" && req_url.query != "/") {
        resp.writeHead(200, {'content-type':'text/plain'});
        f = decodeURIComponent(req_url.query.replace(/\+/g, ' '));
        mplayer_instance.play_list(f);
        resp.end('Playing: '+f);
      }
      return;
    }

    if (req_url.pathname == "/stop") {
      mplayer_instance.stop();
      resp.writeHead(200, {'content-type':'text/plain'});
      resp.end('Stopping Mplayer');
      return;
    }

    if (req_url.pathname == "/rescan") {
      media.scan();
      if (typeof(request.headers.referer) != 'undefined' && request.headers.referer != '') {
        resp.writeHead(302, {'location': request.headers.referer});
        resp.end();
      } else {
        resp.writeHead(200, {'content-type':'text/plain'});
        resp.end('OK');
      }
      return;
    }

    if (req_url.pathname == "/movies") {
      resp.writeHead(200, {'content-type':'text/html'});
      movies = media.movies();
      resp.end(movies_template({
        movies: movies
      }));
      return;
    }

    if (req_url.pathname == "/music") {
      resp.writeHead(200, {'content-type':'text/html'});
      DIfm.stations(function(difm_stations){
        resp.end(music_template({
          difm_stations: difm_stations
        }));
      });
      return;
    }

    if (req_url.pathname == "/tv") {
      resp.writeHead(200, {'content-type':'text/html'});
      all_shows = media.tvShows();
      first_show_name = Object.keys(all_shows)[0];
      show = all_shows[first_show_name];
      episodes = show.episodes();
      resp.end(tv_template({
        all_shows: all_shows,
        show: show,
        episodes: episodes
      }));
      return;
    }

    if (req_url.pathname.indexOf("/tv/") == 0) {
      name = decodeURIComponent(req_url.pathname.replace(/\+/g, ' '));
      name = name.substring(4);
      show = media.tvShow(name);
      if (typeof(show) == "undefined") {
        resp.writeHead(404);
        resp.end("Show '"+name+"' not found.");
        return;
      }
      resp.writeHead(200, {'content-type':'text/html'});
      all_shows = media.tvShows();
      episodes = show.episodes();

      resp.end(tv_template({
        all_shows: all_shows,
        show: show,
        episodes: episodes
      }));
      return;
    }

    if (req_url.pathname == "/status") {
      if (req_url.query == "wait") {
        r_status(resp, false);
      } else {
        r_status(resp, true);
      }
      return;
    }

    if (req_url.pathname == "/") {
      resp.writeHead(302, {'location':'/tv'});
      resp.end();
      return;
    }

    resp.writeHead(404);
    resp.end();

});

log('server', 'Starting server on port '+config.port);

s.listen(config.port);


