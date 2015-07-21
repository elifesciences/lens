"use strict";

var TOCView = require("./toc_view");
var PanelView = require("../panel_view");

var TocPanelView = function( panelCtrl, viewFactory, config ) {
  PanelView.call(this, panelCtrl, config);
  this.toc = new TOCView(panelCtrl.getDocument(), viewFactory);
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

  this.onToggle = function(e) {
    this.trigger('toggle', "toc");
    e.preventDefault();
    e.stopPropagation();
  };
};
TocPanelView.Prototype.prototype = PanelView.prototype;
TocPanelView.prototype = new TocPanelView.Prototype();
TocPanelView.prototype.constructor = TocPanelView;

module.exports =  TocPanelView;
