"use strict";

var Panel = require('./panel');
var ContainerPanelController = require('./container_panel_controller');

var ContainerPanel = function( config ) {
  Panel.call(this, config);
};
ContainerPanel.Prototype = function() {
  this.createController = function(doc) {
    return new ContainerPanelController(doc, this.config);
  };
};
ContainerPanel.Prototype.prototype = Panel.prototype;
ContainerPanel.prototype = new ContainerPanel.Prototype();

module.exports = ContainerPanel;
