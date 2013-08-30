"use strict";

var _ = require("underscore");
var Application = require("substance-application");
var LensController = require("./controllers/lens_controller");
var LensView = require("./views/lens");
var Keyboard = require("substance-commander").Keyboard;
var util = require("substance-util");
var html = util.html;
var Backbone = require("../lib/backbone");
var DEFAULT_CONFIG = require("../config/config.json");

// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || DEFAULT_CONFIG;
  Application.call(this, config);

  this.controller = new LensController(config);
};

Lens.Article = require("lens-article");
Lens.Reader = require("lens-reader");
Lens.Outline = require("lens-outline");


Lens.Prototype = function() {

  // Keyboard registration
  // --------
  // 
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  this.initKeyboard = function() {
    this.keyboard = new Keyboard(this.controller);

    this.controller.on("state-changed", this.keyboard.stateChanged, this.keyboard);
    this.keyboard.set('TRIGGER_PREFIX_COMBOS', true);

    var keymap = require("../config/default.keymap.json");
    this.keyboard.registerBindings(keymap);
  };

  // Start listening to routes
  // --------

  this.initRouter = function() {
    this.router = new Backbone.Router();
    var routes = require("../config/routes.json");

    _.each(routes, function(route) {
      this.router.route(route.route, route.name, _.bind(this.controller[route.command], this.controller));
    }, this);

    Backbone.history.start();
  };

  this.start = function() {
    Application.prototype.start.call(this);

    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);

    this.initRouter();
    this.initKeyboard();
  };
};


Lens.Prototype.prototype = Application.prototype;
Lens.prototype = new Lens.Prototype();
Lens.prototype.constructor = Lens;

var Substance = {
  util: require("substance-util"),
  Test: require("substance-test"),
  Application: require("substance-application"),
  Commander: require("substance-commander"),
  Document: require("substance-document"),
  Operator: require("substance-operator"),
  Chronicle: require("substance-chronicle"),
  Data: require("substance-data"),
  RegExp: require("substance-regexp"),
  Surface: require("substance-surface")
};


// Register tests
// --------
// 

require("lens-converter/tests");
require("substance-application/tests");
require("substance-converter/tests");
require("substance-operator/tests");
require("substance-chronicle/tests");
require("substance-data/tests");
require("substance-document/tests");
// require("substance-article/tests");
require("substance-store/tests");
require("substance-surface/tests");

Lens.Substance = Substance;

module.exports = Lens;
