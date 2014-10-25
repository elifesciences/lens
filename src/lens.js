"use strict";

var _ = require('underscore');
var Application = require("substance-application");
var LensController = require("./lens_controller");
var LensConverter = require("lens-converter");
var LensArticle = require("lens-article");
var ResourcePanelViewFactory = require("./resource_panel_viewfactory");
var ReaderController = require('./reader_controller');
var ReaderView = require('./reader_view');
var PanelFactory = require('./panel_factory');
var PanelView = require('./panel_view');
var ContainerPanelView = require('./container_panel_view');

// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || {};
  config.routes = config.routes || this.getRoutes();
  config.panelFactory = config.panelFactory || this.getPanelFactory();
  config.converter = config.converter || this.getConverter(config.converterOptions);

  // Note: call this after configuration, e.g., routes must be configured before
  //   as they are used to setup a router
  Application.call(this, config);

  this.controller = new LensController(config);
};

Lens.Prototype = function() {

  // Start listening to routes
  // --------

  this.render = function() {
    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);
  };

  this.getRoutes = function() {
    return Lens.getDefaultRoutes();
  };

  this.getPanelFactory = function() {
    return Lens.getDefaultPanelFactory();
  };

  this.getConverter = function(converterConfig) {
    return Lens.getDefaultConverter(converterConfig);
  };

};

Lens.Prototype.prototype = Application.prototype;
Lens.prototype = new Lens.Prototype();
Lens.prototype.constructor = Lens;

Lens.Article = LensArticle;

// TODO: is it really helpful to wrap this into its own 'namespace'
Lens.Reader = {
  Controller: ReaderController,
  View: ReaderView,
  PanelFactory: PanelFactory
};

Lens.DEFAULT_ROUTES = [
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

Lens.getDefaultRoutes = function() {
  return Lens.DEFAULT_ROUTES;
};

Lens.defaultPanelSpecification = require('./panel_specification');

Lens.getDefaultPanelSpecification = function() {
  var spec = _.extend({}, Lens.defaultPanelSpecification);
  spec.panels = _.extend({}, spec.panels);
  return spec;
};

Lens.getDefaultPanelFactory = function() {
  return new Lens.Reader.PanelFactory(Lens.defaultPanelSpecification);
};

Lens.getDefaultConverter = function(converterOptions) {
  return new LensConverter(converterOptions);
};

Lens.Outline = require("lens-outline");

Lens.ResourcePanelViewFactory = ResourcePanelViewFactory;
Lens.PanelView = PanelView;
Lens.ContainerPanelView = ContainerPanelView;

module.exports = Lens;
