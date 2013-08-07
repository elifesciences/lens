"use strict";

var _ = require("underscore");

// Creates a Substance instance
var boot = function() {

  // create a clone of the provided module as we store data into it
  var Lens = _.clone(require("./lens.js"));

  var LensController = require("./controllers/lens_controller");
  var LensView = require("./views/lens");
  var Keyboard = require("substance-commander").Keyboard;
  var util = require("substance-util");
  var Backbone = require("../lib/backbone");

  var html = util.html;

  // Compile templates
  html.compileTemplate('test_center');
  html.compileTemplate('test_report');

  Lens.client_type = 'browser';
  Lens.env = 'development';

  // Initialization
  // -----------------

  // Main Application controller
  Lens.app = new LensController(Lens.env);

  Lens.appView = Lens.app.view;

  $('body').html(Lens.appView.render().el);

  // Setup router (talks to the main app controller)
  Backbone.history.start();

  // Preliminary keyboard configuration stuff...
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  var keyboard = new Keyboard(Lens.app);

  Lens.app.on("state-changed", keyboard.stateChanged, keyboard);

  keyboard.set('TRIGGER_PREFIX_COMBOS', true);

  var keymap = require("../config/default.keymap.json");

  keyboard.registerBindings(keymap);

  Lens.app.keyboard = keyboard;

  return Lens;
};

module.exports = boot;
