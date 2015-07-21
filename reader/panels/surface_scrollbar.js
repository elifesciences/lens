"use strict";

var View = require("../../substance/application").View;
var $$ = require("../../substance/application").$$;
var _ = require("underscore");

// Lens.Scrollbar
// ==========================================================================
//
// A custom scrollbar which allows to add overlays which are rendered at the same
// y-position as their reference elements in the surface.

var Scrollbar = function(surface) {
  View.call(this);

  this.surface = surface;

  // initialized on first update
  this.$nodes = this.surface.$nodes;

  this.$el.addClass('surface-scrollbar');
  this.$el.addClass(surface.docCtrl.getContainer().id);

  this.overlays = [];

  _.bindAll(this, 'mouseDown', 'mouseUp', 'mouseMove', 'updateVisibleArea');

  // Mouse event handlers
  // --------

  this.$el.mousedown(this.mouseDown);

  $(window).mousemove(this.mouseMove);
  $(window).mouseup(this.mouseUp);
};

Scrollbar.Prototype = function() {

  // Render Document Scrollbar
  // -------------
  //
  // Renders outline and calculates bounds

  this.render = function() {
    var contentHeight = this.$nodes.height();
    var panelHeight = this.surface.$el.height();
    this.factor = (contentHeight / panelHeight);
    this.visibleArea = $$('.visible-area');
    // Init scroll pos
    this.scrollTop = this.surface.$el.scrollTop();
    this.el.innerHTML = "";
    this.el.appendChild(this.visibleArea);
    this.updateVisibleArea();
    return this;
  };


  // Update visible area
  // -------------
  //
  // Should get called from the user when the content area is scrolled

  this.updateVisibleArea = function() {
    $(this.visibleArea).css({
      "top": this.scrollTop / this.factor,
      "height": this.surface.$el.height() / this.factor
    });
  };

  this.addOverlay = function(el) {
    // We need to store the surface node element together with overlay element
    //
    var $overlay = $('<div>').addClass('node overlay');
    this.overlays.push({ el: el, $overlay: $overlay });
    this.$el.append($overlay);
    return $overlay;
  };

  this.updateOverlay = function(el, $overlay) {
    var $el = $(el);
    var height = $el.outerHeight(true) / this.factor;
    var top = ($el.offset().top - this.surfaceTop) / this.factor;
    // HACK: make all highlights at least 3 pxls high, and centered around the desired top pos
    if (height < Scrollbar.OverlayMinHeight) {
      height = Scrollbar.OverlayMinHeight;
      top = top - 0.5 * Scrollbar.OverlayMinHeight;
    }
    $overlay.css({
        "height": height,
        "top": top
      });
  };

  // Add highlights to scrollbar
  // -------------
  //

  this.addHighlight = function(nodeId, classes) {
    var nodeEl = this.surface.findNodeView(nodeId);
    if (!nodeEl) {
      // Note: this happens on a regular basis, as very often we ask e.g. the index to give
      // all annotation targeting to a resource. But the reference itself does not necessarily be part of
      // this surface
      return;
    }
    var $overlay = this.addOverlay(nodeEl);
    this.updateOverlay(nodeEl, $overlay);
    $overlay.addClass(classes);
    return $overlay[0];
  };

  this.addHighlights = function(nodeIds, classes) {
    var overlayEls = [];
    for (var i = 0; i < nodeIds.length; i++) {
      var overlayEl = this.addHighlight(nodeIds[i], classes);
      overlayEls.push(overlayEl);
    }
    this.update();
    return overlayEls;
  };

  this.removeHighlights = function() {
    for (var i = 0; i < this.overlays.length; i++) {
      var overlay = this.overlays[i];
      overlay.$overlay.remove();
    }
  };

  this.update = function() {
    // initialized lazily as this element is not accessible earlier (e.g. during construction)
    // get the new dimensions
    var contentHeight = this.$nodes.height();
    var panelHeight = this.surface.$el.height();

    if (contentHeight > panelHeight) {
      $(this.el).removeClass('hidden');
    } else {
      $(this.el).addClass('hidden');
    }

    // console.log("Scrollbar.update()", contentHeight, panelHeight);
    this.factor = (contentHeight / panelHeight);
    this.surfaceTop = this.$nodes.offset().top;
    this.scrollTop = this.surface.$el.scrollTop();
    this.updateVisibleArea();
    for (var i = 0; i < this.overlays.length; i++) {
      var overlay = this.overlays[i];
      this.updateOverlay(overlay.el, overlay.$overlay);
    }
  };

  // Handle Mouse down event
  // -----------------
  //

  this.mouseDown = function(e) {
    this._mouseDown = true;
    var y = e.pageY;
    if (e.target !== this.visibleArea) {
      // Jump to mousedown position
      this.offset = $(this.visibleArea).height()/2;
      this.mouseMove(e);
    } else {
      this.offset = y - $(this.visibleArea).position().top;
    }
    return false;
  };

  // Handle Mouse Up
  // -----------------
  //
  // Mouse lifted, no scroll anymore

  this.mouseUp = function() {
    this._mouseDown = false;
  };

  // Handle Scroll
  // -----------------
  //
  // Handle scroll event
  // .visible-area handle

  this.mouseMove = function(e) {
    if (this._mouseDown) {
      var y = e.pageY;
      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      this.scrollTop = this.surface.$el.scrollTop(scroll);
      this.updateVisibleArea();
    }
  };

  this.onScroll = function() {
    if (this.surface) {
      this.scrollTop = this.surface.$el.scrollTop();
      this.updateVisibleArea();
    }
  };

};

Scrollbar.Prototype.prototype = View.prototype;
Scrollbar.prototype = new Scrollbar.Prototype();

Scrollbar.OverlayMinHeight = 5;

module.exports = Scrollbar;
