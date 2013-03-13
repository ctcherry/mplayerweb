var config = require('./../config');
var log = require('./log').log(config.log_file);
var glob = require('glob');
var path = require('path');
var _ = require('underscore')._;

exports.MediaStore = function(root) {
  var _root_path = root;
  var _tvShowCollection = {};
  var _movieCollection = [];

  var MovieModel = function(full_path) {
    this.path = full_path;
    file_name = path.basename(full_path);
    var matches = file_name.match(/(.+?)\(?(\d{4})\)?/);
    if (matches == null) {
      this.title = file_name;
      this.year = null;
      this.display_name = this.title;
    } else {
      this.title = matches[1].replace(/[\.\_]+/g, ' ').replace(/^\s+|\s+$/g, '');
      this.year = parseInt(matches[2]);
      this.display_name = this.title+" ("+this.year+")";
    }
  }

  var TVEpisodeModel = function(show, full_path) {
    this.show = show;
    this.path = full_path;
    this.name = path.basename(full_path);
    this.display_name = this.name;
    this.season = 0;
    this.episodes = [];
  }

  var TVShowModel = function(full_path) {
    var show = this;
    this.path = full_path;
    this.name = path.basename(full_path);
    this.display_name = this.name.replace(/_/g, ' ');
    var _episodes = [];

    this.episodes = function() {
      return _episodes;
    }

    var _scan = function() {
      p = this.path + "/*";
      newEpisodes = _.map(glob.sync(p), function(path) {
        return new TVEpisodeModel(show, path);
      });
      _episodes = newEpisodes;
    }

    this.scan = _scan;
    this.scan();
  }

  this.tvShows = function() {
    return _tvShowCollection;
  }

  this.tvShow = function(name) {
    return _tvShowCollection[name];
  }

  this.movies = function() {
    return _movieCollection;
  }

  var _scan = function() {
    newTvShowCollection = {}
    p = _root_path+"/TV/*";
    show_dirs = glob.sync(p)
    _.each(show_dirs, function(dir) {
      var show = new TVShowModel(dir);
      newTvShowCollection[show.name] = show;
    });
    _tvShowCollection = newTvShowCollection;

    tmp_movies = [];
    mpath = _root_path+"/Movies/*";
    movie_paths = glob.sync(mpath)
    _.each(movie_paths, function(mp) {
      var movie = new MovieModel(mp);
      tmp_movies.push(movie);
    });
    _movieCollection = tmp_movies;

  }

  this.scan = _scan;
  this.scan();
}