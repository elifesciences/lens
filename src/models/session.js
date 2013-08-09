"use strict";

var _ = require("underscore");

var util = require("substance-util");
var Chronicle = require("substance-chronicle");
var Article = require("lens-article");

// Lens.Session
// -----------------
//
// The main model thing

var Session = function(env) {
  this.env = env;
};

window.handleDoc = null;

Session.Prototype = function() {

  // Load document from data folder
  // --------

  this.loadDocument = function(name, cb) {    
    $.getJSON("data/"+name+".json", function(data) {
      var doc = Article.fromSnapshot(data, {
        chronicle: Chronicle.create()
      });
      cb(null, doc);
    }).error(cb);
  };
};

Session.prototype = new Session.Prototype();
_.extend(Session.prototype, util.Events);

module.exports = Session;
