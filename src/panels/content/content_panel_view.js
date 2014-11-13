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

  this._onTocItemSelected = _.bind( this.jumpToNode, this );

  this.resources = new Index(panelCtrl.getDocument(), {
    types: ["resource_reference"],
    property: "target"
  });

  // scroll to the associated node when clicking onto the outline
  // TODO: make this a dedicated event of the outline
  this.outline.$el.on('click', '.node', _.bind(this._jumpToNode, this));
  this.tocView.toc.on('toc-item-selected', this._onTocItemSelected);

  this.$el.addClass('document');
};

ContentPanelView.Prototype = function() {

  this.render = function() {
    this.surface.render();
    return this;
  };

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
    this.outline.updateVisibleArea(scrollTop);
    this.markActiveHeading(scrollTop);
  };

  // Jump to the given node id
  // --------
  //

  this.jumpToNode = function(nodeId) {
    var n = this.findNodeView(nodeId);
    if (n) {
      var topOffset = $(n).position().top+CORRECTION;
      this.surface.$el.scrollTop(topOffset);
    }
  };

  this._jumpToNode = function(e) {
    var nodeId = $(e.currentTarget).attr('id').replace("outline_", "");
    this.jumpToNode(nodeId);
    return false;
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

  this.deactivateActiveAnnotations = function() {
    this.$el.find('.annotation.active').removeClass('active');
  };


  this.getResourceReferenceContainers = function(target) {
    if (!target) return [];
    // A reference is an annotation node. We want to highlight
    // all (top-level) nodes that contain a reference to the currently activated resource
    // For that we take all references pointing to the resource
    // and find the root of the node on which the annotation sticks on.
    var references = this.resources.get(target);
    var container = this.controller.getContainer();
    var nodes = _.uniq(_.map(references, function(ref) {
      var nodeId = container.getRoot(ref.path[0]);
      return nodeId;
    }));
    return nodes;
  };

  this.updateOutline = function(options) {
    if (options.target) {
      var annotations = this.resources.get(options.target);
      options.highlightedNodes = Object.keys(annotations);
    }
    this.outline.update(options);
  };

};
ContentPanelView.Prototype.prototype = ContainerPanelView.prototype;
ContentPanelView.prototype = new ContentPanelView.Prototype();
ContentPanelView.prototype.constructor = ContentPanelView;

module.exports = ContentPanelView;
