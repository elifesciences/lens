"use strict";

var _ = require("underscore");
var Application = require("substance-application");
var LensController = require("./lens_controller");
var LensView = require("./lens_view");
var util = require("substance-util");
var html = util.html;
var Backbone = require("./lib/backbone");


// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || {};
  Application.call(this, config);

  this.controller = new LensController(config);
};

Lens.Article = require("lens-article");
Lens.Reader = require("lens-reader");
Lens.Outline = require("lens-outline");


Lens.routes = [
  {
    "route": ":context/:node/:resource/:fullscreen",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node/:resource",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node/:resource",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node",
    "name": "document-node", 
    "command": "openReader"
  },
  {
    "route": ":context",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "",
    "name": "document",
    "command": "openReader"
  }
];

Lens.Prototype = function() {

  // Keyboard registration
  // --------
  // 
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  // this.initKeyboard = function() {
  //   this.keyboard = new Keyboard(this.controller);

  //   this.controller.on("state-changed", this.keyboard.stateChanged, this.keyboard);
  //   this.keyboard.set('TRIGGER_PREFIX_COMBOS', true);

  //   var keymap = require("../config/default.keymap.json");
  //   this.keyboard.registerBindings(keymap);
  // };

  // Start listening to routes
  // --------

  this.initRouter = function() {
    this.router = new Backbone.Router();
    // var routes = require("../config/routes.json");

    _.each(Lens.routes, function(route) {
      this.router.route(route.route, route.name, _.bind(this.controller[route.command], this.controller));
    }, this);

    Backbone.history.start();
  };

  this.start = function() {
    Application.prototype.start.call(this);

    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);

    this.initRouter();
  };
};


Lens.Prototype.prototype = Application.prototype;
Lens.prototype = new Lens.Prototype();
Lens.prototype.constructor = Lens;

var Substance = {
  util: require("substance-util"),
  Application: require("substance-application"),
  Document: require("substance-document"),
  Operator: require("substance-operator"),
  Chronicle: require("substance-chronicle"),
  Data: require("substance-data"),
  Surface: require("substance-surface")
};

Lens.Substance = Substance;

module.exports = Lens;
