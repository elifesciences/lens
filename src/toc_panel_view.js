"use strict";

var TOC = require("substance-toc");
var PanelView = require("./panel_view");

var TocPanelView = function( doc, config ) {
  PanelView.call(this, doc, config);
  this.toc = new TOC(doc);
};
TocPanelView.Prototype = function() {
  this.render = function() {
    this.el.appendChild(this.toc.render().el);

    return this;
  };
};
TocPanelView.Prototype.prototype = PanelView.prototype;
TocPanelView.prototype = new TocPanelView.Prototype();
TocPanelView.prototype.constructor = TocPanelView;

module.exports =  TocPanelView;
