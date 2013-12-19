"use strict";

var _ = require("underscore");
var Application = require("substance-application");
var LensController = require("./lens_controller");
var LensView = require("./lens_view");
var util = require("substance-util");
var html = util.html;

var ROUTES = [
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
    "route": "url/:url",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "",
    "name": "document",
    "command": "openReader"
  }
];

// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || {};
  config.routes = ROUTES;
  Application.call(this, config);

  this.controller = new LensController(config);
};

Lens.Article = require("lens-article");
Lens.Reader = require("substance-reader");
Lens.Outline = require("lens-outline");


Lens.Prototype = function() {

  // Start listening to routes
  // --------

  this.render = function() {
    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);
  }
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
