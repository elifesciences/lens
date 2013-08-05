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

  // Start the engines
  // Substance.appView = new SandboxView(Substance.app);

  $('body').html(Lens.appView.render().el);

  // Setup router (talks to the main app controller)
  Backbone.history.start();

  // Preliminary keyboard configuration stuff...
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  var keyboard = new Keyboard(Lens.app);

  Lens.app.on("state-changed", keyboard.stateChanged, keyboard);

  // TODO: it would be nice to add a built-in handler for handling 'typed text'
  // and use it in a declarative way e.g.:
  // {"command": "write", keys: "typed-text" }
  // keyboard.setDefaultHandler("sandbox.article.writer", function(character, modifiers, e) {
  //   if (e.type === "keypress") {
  //     var str = null;

  //     // TODO: try to find out which is the best way to detect typed characters
  //     str = String.fromCharCode(e.charCode);

  //     if (e.charCode !== 0  && !e.ctrlKey && str !== null && str.length > 0) {
  //       // TODO: consume the event
  //       e.preventDefault();
  //       return {command: "write", args: [str]};
  //     }
  //   }
  //   return false;
  // });

  keyboard.set('TRIGGER_PREFIX_COMBOS', true);

  var keymap = require("../config/default.keymap.json");

  // if (global.navigator !== undefined) {
  //   var platform = global.navigator.platform;
  //   if (platform.toLowerCase().search("linux") >= 0) {
  //     keymap = require("../config/linux.keymap.json");
  //   }
  //   else if (platform.toLowerCase().search("win32") >= 0) {
  //     keymap = require("../config/windows.keymap.json");
  //   }
  // }

  keyboard.registerBindings(keymap);

  Lens.app.keyboard = keyboard;

  return Lens;
};

module.exports = boot;
