"use strict";

var _ = require('underscore');
var ContainerPanelView = require('../container_panel_view');
var TocPanelView = require("./toc_panel_view");

var CORRECTION = 0; // Extra offset from the top

/* Adding + 1 pixel solves an edge case where clicking on a
   TOC item did not mark it as active, but the previous one */
var MENU_BAR_HEIGHT = 1; 

var ContentPanelView = function( panelCtrl, viewFactory, config ) {
  ContainerPanelView.call(this, panelCtrl, viewFactory, config);

  this.tocView = new TocPanelView(panelCtrl, viewFactory, _.extend({}, config, { type: 'resource', name: 'toc' }));
  // cache the elements of all toc nodes to allow an efficient implementation
  // of a scroll-spy in the TOC
  this.tocNodeElements = {};

  this._onTocItemSelected = _.bind( this.onTocItemSelected, this );

  // TODO: we should provide this index 'by default', as it is required by other (node/panel) views, too
  this.resources = panelCtrl.getDocument().addIndex('referenceByTarget', {
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
      n.scrollIntoView();
    }
  };

  // Mark active heading / TOC node (~ scroll-spy)
  // --------
  //

  this.markActiveHeading = function(scrollTop) {
    // scrollTop = scrollTop - 30;
    var contentHeight = $('.nodes').height();
    var tocNodes = this.getDocument().getTocNodes();

    var _getTocNodeElement = function(id) {
      var el = this.tocNodeElements[id];
      if (!el) {
        el = this.tocNodeElements[id] = this.findNodeView(id);
      }
      return el;
    }.bind(this);

    // No toc items?
    if (tocNodes.length === 0) return;

    var activeNode;
    var firstEl = _getTocNodeElement(tocNodes[0].id);

    // default
    activeNode = tocNodes[0].id;

    // and select the last item (once we reach the end of the doc)
    if (scrollTop + this.$el.height() >= contentHeight) {
      activeNode = _.last(tocNodes).id;
    }
    // starting from the end of document find the first node which is above the
    // current scroll position
    else {
      // TODO: maybe this could be optimized by a binary search
      for (var i = tocNodes.length - 1; i >= 1; i--) {
        var tocNode = tocNodes[i];
        var el = _getTocNodeElement(tocNode.id);
        if (!el) {
          console.error('Could not find element for node %s', tocNode.id);
          continue;
        }
        
        // HACK: we subtract height of menu bar so marking of active nodes stays accurate
        var elTopOffset = $(el).offset().top - MENU_BAR_HEIGHT;
        if (elTopOffset <= 0) {
          activeNode = el.dataset.id;
          break;
        }
      }
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
