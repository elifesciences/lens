"use strict";

var ContainerPanelController = require('../container_panel_controller');
var ContentPanelView = require('./content_panel_view');

var ContentPanelController = function(doc, config) {
  ContainerPanelController.call(this, doc, config);
};
ContentPanelController.Prototype = function() {
  this.createView = function() {
    if (!this.view) {
      var doc = this.getDocument();
      var DefaultViewFactory = doc.constructor.ViewFactory;
      var viewFactory = new DefaultViewFactory(doc.nodeTypes, this.config);
      this.view = new ContentPanelView(this, viewFactory, this.config);
    }
    return this.view;
  };
};
ContentPanelController.Prototype.prototype = ContainerPanelController.prototype;
ContentPanelController.prototype = new ContentPanelController.Prototype();

module.exports = ContentPanelController;
