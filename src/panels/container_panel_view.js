"use strict";

var _ = require("underscore");
var Outline = require("lens-outline");

var Surface = require("../lens_surface");
var PanelView = require("./panel_view");

// TODO: try to get rid of DocumentController and use the Container node instead
var ContainerPanelView = function( panelCtrl, viewFactory, config ) {
  PanelView.call(this, panelCtrl, config);

  this.surface = new Surface( panelCtrl.docCtrl, {
    editable: false,
    viewFactory: viewFactory
  });
  this.docCtrl = panelCtrl.docCtrl;

  // TODO: same here: why should the Outline need a Document.Controller?
  // This should be a container
  this.outline = new Outline(this.surface);

  this._onScroll = _.bind(this.onScroll, this);
  this.surface.$el.on('scroll', this._onScroll );

  this.surface.$el.addClass('resource-view').addClass(config.container);

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

  // Jump to the given resource id
  // --------
  //

  this.jumpToResource = function(nodeId) {
    var n = this.findNodeView(nodeId);
    if (n) {
      var topOffset = $(n).position().top;
      this.surface.$el.scrollTop(topOffset);
      // TODO: is it possible to detect this case and just do it in mobile?
      // Brute force for mobile
      $(document).scrollTop(topOffset);
    } else {
      console.log("PanelView.jumpToResource(): Unknown resource '%s'", nodeId);
    }
  };

  this.findNodeView = function(nodeId) {
    return this.surface.findNodeView(nodeId);
  };

};

ContainerPanelView.Prototype.prototype = PanelView.prototype;
ContainerPanelView.prototype = new ContainerPanelView.Prototype();
ContainerPanelView.prototype.constructor = ContainerPanelView;

module.exports = ContainerPanelView;
