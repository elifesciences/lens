"use strict";

var ContainerPanel = require('../container_panel');
var ContentPanelController = require('./content_panel_controller');

var ContentPanel = function() {
  ContainerPanel.call(this, {
    name: "content",
    type: "document",
    container: "content",
    label: 'Contents',
    title: 'Contents',
    icon: 'fa-align-left',
  });
};
ContentPanel.Prototype = function() {
  this.createController = function(doc) {
    return new ContentPanelController(doc, this.config);
  };
};
ContentPanel.Prototype.prototype = ContainerPanel.prototype;
ContentPanel.prototype = new ContentPanel.Prototype();

module.exports = ContentPanel;
