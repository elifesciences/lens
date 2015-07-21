"use strict";

var Document = require('../../substance/document');
var PanelController = require('./panel_controller');
var ResourcePanelViewFactory = require('./resource_panel_viewfactory');
var ContainerPanelView = require('./container_panel_view');

var ContainerPanelController = function( doc, config ) {
  PanelController.call(this, doc, config);
  this.docCtrl = new Document.Controller( doc, { view: config.container } );
};
ContainerPanelController.Prototype = function() {

  this.createView = function() {
    var doc = this.getDocument();
    var viewFactory;
    if (this.config.type === 'resource') {
      if (this.config.createViewFactory) {
        viewFactory = this.config.createViewFactory(doc, this.config);
      } else {
        viewFactory = new ResourcePanelViewFactory(doc.nodeTypes, this.config);
      }
    } else {
      var DefaultViewFactory = doc.constructor.ViewFactory;
      viewFactory = new DefaultViewFactory(doc.nodeTypes, this.config);
    }
    this.viewFactory = viewFactory;
    return new ContainerPanelView(this, viewFactory, this.config);
  };

  this.getContainer = function() {
    return this.docCtrl.getContainer();
  };

};
ContainerPanelController.Prototype.prototype = PanelController.prototype;
ContainerPanelController.prototype = new ContainerPanelController.Prototype();

module.exports = ContainerPanelController;
