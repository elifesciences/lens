"use strict";

var _ = require('underscore');

var TocPanelView = require("./toc_panel_view");
var ContainerPanelView = require('./container_panel_view');

var CORRECTION = 0; // Extra offset from the top

var ContentPanelView = function( doc, docCtrl, renderer, config ) {
  ContainerPanelView.call(this, doc, docCtrl, renderer, config);

  this.tocView = new TocPanelView(doc, _.extend({}, config, { type: 'resource', name: 'toc' }));

  this._onTocItemSelected = _.bind( this.jumpToNode, this );

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
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top+CORRECTION;
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
        activeNode = this.id;
      }
    });
    // Edge case: select last item (once we reach the end of the doc)
    if (scrollTop + this.$el.height() >= contentHeight) {
      activeNode = _.last(headings).id;
    }
    this.tocView.setActiveNode(activeNode);
  };

};
ContentPanelView.Prototype.prototype = ContainerPanelView.prototype;
ContentPanelView.prototype = new ContentPanelView.Prototype();
ContentPanelView.prototype.constructor = ContentPanelView;

module.exports = ContentPanelView;
