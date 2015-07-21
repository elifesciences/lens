"use strict";

var Lens = require('lens/reader');
var ContainerPanel = Lens.ContainerPanel;
var ContainerPanelController = Lens.ContainerPanelController;
var ContainerPanelView = Lens.ContainerPanelView;
var ResourcePanelViewFactory = Lens.ResourcePanelViewFactory;

var MathPanelView = function() {
  ContainerPanelView.apply(this, arguments);
};

MathPanelView.Prototype = function() {
  var __super__ = ContainerPanelView.prototype;

  this.render = function() {
    __super__.render.call(this);
    this.$el.append(this.$showUnreferenced);
    return this;
  };
};

MathPanelView.Prototype.prototype = ContainerPanelView.prototype;
MathPanelView.prototype = new MathPanelView.Prototype();

var MathPanelController = function() {
  ContainerPanelController.apply(this, arguments);
};

MathPanelController.Prototype = function() {
  this.createView = function() {
    var doc = this.getDocument();
    var viewFactory = new ResourcePanelViewFactory(doc.nodeTypes, this.config);
    return new MathPanelView(this, viewFactory, this.config);
  };
};

MathPanelController.Prototype.prototype = ContainerPanelController.prototype;
MathPanelController.prototype = new MathPanelController.Prototype();

var MathPanel = function() {
  ContainerPanel.call(this, {
    type: 'resource',
    name: 'math',
    container: 'math',
    title: 'Math',
    icon: 'fa-superscript',
  });
};

MathPanel.Prototype = function() {
  this.createController = function(doc) {
    return new MathPanelController(doc, this.config);
  };
};
MathPanel.Prototype.prototype = ContainerPanel.prototype;
MathPanel.prototype = new MathPanel.Prototype();

module.exports = MathPanel;
