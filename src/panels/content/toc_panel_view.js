"use strict";

var TOC = require("substance-toc");
var PanelView = require("../panel_view");

var TocPanelView = function( panelCtrl, config ) {
  PanelView.call(this, panelCtrl, config);
  this.toc = new TOC(panelCtrl.getDocument());
};
TocPanelView.Prototype = function() {

  this.render = function() {
    this.el.appendChild(this.toc.render().el);
    return this;
  };

  // Delegate
  this.setActiveNode = function(nodeId) {
    this.toc.setActiveNode(nodeId);
  };

};
TocPanelView.Prototype.prototype = PanelView.prototype;
TocPanelView.prototype = new TocPanelView.Prototype();
TocPanelView.prototype.constructor = TocPanelView;

module.exports =  TocPanelView;
