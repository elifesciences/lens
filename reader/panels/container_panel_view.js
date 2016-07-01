"use strict";

var _ = require("underscore");
var Scrollbar = require("./surface_scrollbar");
var Surface = require("../lens_surface");
var PanelView = require("./panel_view");
var getRelativeBoundingRect = require('../../substance/util/getRelativeBoundingRect');

// TODO: try to get rid of DocumentController and use the Container node instead
var ContainerPanelView = function( panelCtrl, viewFactory, config ) {
  PanelView.call(this, panelCtrl, config);

  this.surface = new Surface( panelCtrl.docCtrl, {
    editable: false,
    viewFactory: viewFactory
  });
  this.docCtrl = panelCtrl.docCtrl;

  this.scrollbar = new Scrollbar(this.surface);

  this._onScroll = _.bind(this.onScroll, this);
  this.surface.$el.on('scroll', this._onScroll );

  this.surface.$el.addClass('resource-view').addClass(config.container);

  this.el.appendChild(this.surface.el);
  this.el.appendChild(this.scrollbar.el);

  this.$activeResource = null;
};

ContainerPanelView.Prototype = function() {

  this.render = function() {
    // Hide the whole tab if there is no content
    if (this.getContainer().getLength() === 0) {
      this.hideToggle();
      this.hide();
    } else {
      this.surface.render();
      this.scrollbar.render();
    }
    return this;
  };

  this.getContainer = function() {
    return this.docCtrl.container;
  };

  this.onScroll = function() {
    this.scrollbar.onScroll();
  };

  this.hasScrollbar = function() {
    return true;
  };

  this.scrollTo = function(nodeId) {
    var n = this.findNodeView(nodeId);
    if (n) {
      var panelHeight = this.surface.$el.height();
      var screenTop = this.surface.$el.scrollTop();
      var screenBottom = screenTop + panelHeight;
      var elRect = getRelativeBoundingRect([n], this.surface.$nodes[0]);
      var elHeight = elRect.height;

      var upperBound = elRect.top; // top-offset of upper bound to relative parent
      var lowerBound = upperBound+elRect.height; // top-offset of lower bound to relative parent

      // Do not scroll if the element is fully visible
      if (upperBound>=screenTop && lowerBound <= screenBottom) {
        return;
      }

      this.surface.$el.scrollTop(upperBound);
      this.scrollbar.update();
    } else {
      console.info("ContainerPanelView.scrollTo(): Unknown resource '%s'", nodeId);
    }
  };

  this.findNodeView = function(nodeId) {
    return this.surface.findNodeView(nodeId);
  };

  this.addHighlight = function(id, classes) {
    PanelView.prototype.addHighlight.call(this, id, classes);
    var node = this.getDocument().get(id);
    if (node) this.scrollbar.addHighlight(id, classes + " " + node.type);
  };

  this.removeHighlights = function() {
    PanelView.prototype.removeHighlights.call(this);
    this.scrollbar.removeHighlights();
    this.scrollbar.update();
  };

  // call this after you finsihed adding/removing highlights
  this.update = function() {
    this.scrollbar.update();
  };

  this.hide = function() {
    if (this.hidden) return;
    PanelView.prototype.hide.call(this);
  };

  this.show = function() {
    this.scrollbar.update();
    PanelView.prototype.show.call(this);
  };

};

ContainerPanelView.Prototype.prototype = PanelView.prototype;
ContainerPanelView.prototype = new ContainerPanelView.Prototype();
ContainerPanelView.prototype.constructor = ContainerPanelView;

module.exports = ContainerPanelView;
