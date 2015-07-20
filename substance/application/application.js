"use strict";

var View = require("./view");
var Router = require("./router");
var util = require("../../substance/util");
var _ = require("underscore");

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(config) {
  View.call(this);
  this.config = config;
};

Application.Prototype = function() {
  
  // Init router
  // ----------

  this.initRouter = function() {
    this.router = new Router();

    _.each(this.config.routes, function(route) {
      this.router.route(route.route, route.name, _.bind(this.controller[route.command], this.controller));
    }, this);

    Router.history.start();
  };

  // Start Application
  // ----------
  //

  this.start = function() {
    // First setup the top level view
    this.$el = $('body');
    this.el = this.$el[0];
    this.render();

    // Now the normal app lifecycle can begin
    // Because app state changes require the main view to be present
    // Triggers an initial app state change according to url hash fragment
    this.initRouter();
  };
};

// Setup prototype chain

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

module.exports = Application;
