"use strict";

var Application = require("../substance/application");
var LensController = require("./lens_controller");
var LensConverter = require("lens/converter");
var LensArticle = require("lens/article");
var ResourcePanelViewFactory = require("./panels/resource_panel_viewfactory");
var ReaderController = require('./reader_controller');
var ReaderView = require('./reader_view');

var Panel = require('./panels/panel');
var PanelController = require('./panels/panel_controller');
var PanelView = require('./panels/panel_view');
var ContainerPanel = require('./panels/container_panel');
var ContainerPanelController = require('./panels/container_panel_controller');
var ContainerPanelView = require('./panels/container_panel_view');
var Workflow = require('./workflows/workflow');

var defaultPanels = require('./default_panels');
var defaultWorkflows = require('./default_workflows');

// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || {};
  config.routes = config.routes || this.getRoutes();
  config.panels = config.panels || this.getPanels();
  config.workflows = config.workflows || this.getWorkflows();

  // All available converters
  config.converters = this.getConverters(config.converterOptions);

  // Note: call this after configuration, e.g., routes must be configured before
  //   as they are used to setup a router
  Application.call(this, config);

  this.controller = config.controller || this.createController(config);
};

Lens.Prototype = function() {

  this.start = function() {
    Application.prototype.start.call(this);
  };

  // Start listening to routes
  // --------

  this.render = function() {
    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);
  };

  this.getRoutes = function() {
    return Lens.getDefaultRoutes();
  };

  this.getPanels = function() {
    return Lens.getDefaultPanels();
  };

  this.getWorkflows = function() {
    return Lens.getDefaultWorkflows();
  };

  this.getConverters = function(converterConfig) {
    return [ Lens.getDefaultConverter(converterConfig) ];
  };

  this.createController = function(config) {
    return new LensController(config);
  };
};

Lens.Prototype.prototype = Application.prototype;
Lens.prototype = new Lens.Prototype();
Lens.prototype.constructor = Lens;

Lens.DEFAULT_ROUTES = [
  {
    "route": ":context/:focussedNode/:fullscreen",
    "name": "document-focussed-fullscreen",
    "command": "openReader"
  },
  {
    "route": ":context/:focussedNode",
    "name": "document-focussed",
    "command": "openReader"
  },
  {
    "route": ":context",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "url/:url",
    "name": "document",
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

Lens.getDefaultPanels = function() {
  return defaultPanels.slice(0);
};

Lens.getDefaultWorkflows = function() {
  return defaultWorkflows.slice(0);
};

Lens.getDefaultConverter = function(converterOptions) {
  return new LensConverter(converterOptions);
};

Lens.Article = LensArticle;
Lens.ReaderController = ReaderController;
Lens.ReaderView = ReaderView;
Lens.Controller = LensController;
Lens.LensController = LensController;

Lens.Panel = Panel;
Lens.PanelController = PanelController;
Lens.PanelView = PanelView;
Lens.ContainerPanel = ContainerPanel;
Lens.ContainerPanelController = ContainerPanelController;
Lens.ContainerPanelView = ContainerPanelView;
Lens.ResourcePanelViewFactory = ResourcePanelViewFactory;

Lens.Workflow = Workflow;

module.exports = Lens;
