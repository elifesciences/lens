"use strict";

var _ = require('underscore');
var ContainerPanelView = require('../container_panel_view');
var TocPanelView = require("./toc_panel_view");
var Data = require("substance-data");
var Index = Data.Graph.Index;

var CORRECTION = 0; // Extra offset from the top

var ContentPanelView = function( panelCtrl, viewFactory, config ) {
  ContainerPanelView.call(this, panelCtrl, viewFactory, config);

  this.tocView = new TocPanelView(panelCtrl, viewFactory, _.extend({}, config, { type: 'resource', name: 'toc' }));

  this._onTocItemSelected = _.bind( this.onTocItemSelected, this );

  this.resources = new Index(panelCtrl.getDocument(), {
    types: ["resource_reference"],
    property: "target"
  });

  this.tocView.toc.on('toc-item-selected', this._onTocItemSelected);

  this.$el.addClass('document');
};

ContentPanelView.Prototype = function() {

  this.dispose = function() {
    this.tocView.toc.off('toc-item-selected', this._onTocItemSelected);
    this.stopListening();
  };

  this.getTocView = function() {
    return this.tocView;
  };

  // On Scroll update outline and mark active heading
  // --------
  //

  this.onScroll = function() {
    var scrollTop = this.surface.$el.scrollTop();
    this.scrollbar.update();
    this.markActiveHeading(scrollTop);
  };

  // Jump to the given node id
  // --------
  //

  this.onTocItemSelected = function(nodeId) {
    var n = this.findNodeView(nodeId);
    if (n) {
      var topOffset = $(n).position().top+CORRECTION;
      this.surface.$el.scrollTop(topOffset);
    }
  };

  // Mark active heading
  // --------
  //

  this.markActiveHeading = function(scrollTop) {
    var contentHeight = $('.nodes').height();
    var headings = this.getDocument().getHeadings();

    // No headings?
    if (headings.length === 0) return;
    // Use first heading as default
    var activeNode = _.first(headings).id;

    this.$('.content-node.heading').each(function() {
      if (scrollTop >= $(this).position().top + CORRECTION) {
        activeNode = this.dataset.id;
      }
    });

    // Edge case: select last item (once we reach the end of the doc)
    if (scrollTop + this.$el.height() >= contentHeight) {
      activeNode = _.last(headings).id;
    }
    this.tocView.setActiveNode(activeNode);
  };

  this.markReferencesTo = function(target) {
    // Mark all annotations that reference the resource
    var annotations = this.resources.get(target);
    _.each(annotations, function(a) {
      $(this.findNodeView(a.id)).addClass('active');
    }, this);
  };

  this.removeHighlights = function() {
    ContainerPanelView.prototype.removeHighlights.call(this);
    this.$el.find('.content-node.active').removeClass('active');
    this.$el.find('.annotation.active').removeClass('active');
  };

};
ContentPanelView.Prototype.prototype = ContainerPanelView.prototype;
ContentPanelView.prototype = new ContentPanelView.Prototype();
ContentPanelView.prototype.constructor = ContentPanelView;

module.exports = ContentPanelView;
