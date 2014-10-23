"use strict";

var _ = require("underscore");

var PanelView = require("./panel_view");
var Surface = require("substance-surface");
var Outline = require("lens-outline");

// TODO: try to get rid of DocumentController and use the Container node instead
var ContainerPanelView = function( doc, docCtrl, renderer, config ) {
  PanelView.call(this, doc, config);

  this.surface = new Surface(docCtrl, {
    editable: false,
    renderer: renderer
  });
  this.docCtrl = docCtrl;

  // TODO: same here: why should the Outline need a Document.Controller?
  // This should be a container
  this.outline = new Outline(this.surface);

  this._onScroll = _.bind(this.onScroll, this);
  this.surface.$el.on('scroll', this._onScroll );

  this.el.appendChild(this.surface.el);
  this.el.appendChild(this.outline.el);
};

ContainerPanelView.Prototype = function() {

  this.render = function() {
    // Hide the whole tab if there is no content
    if (this.getContainer().getLength() === 0) {
      this.hideToggle();
      this.hide();
    } else {
      this.surface.render();
    }
    return this;
  };

  this.getContainer = function() {
    return this.docCtrl.container;
  };

  this.onScroll = function() {
    // Make sure that a surface is attached to the resources outline
    if (this.outline.surface) {
      var scrollTop = this.outline.surface.$el.scrollTop();
      this.outline.updateVisibleArea(scrollTop);
    }
  };

  this.hasOutline = function() {
    return true;
  };

  this.updateOutline = function(options) {
    this.outline.update(options);
  };

};

ContainerPanelView.Prototype.prototype = PanelView.prototype;
ContainerPanelView.prototype = new ContainerPanelView.Prototype();
ContainerPanelView.prototype.constructor = ContainerPanelView;

module.exports = ContainerPanelView;
