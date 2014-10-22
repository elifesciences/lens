
var _ = require('underscore');
var TOC = require("substance-toc");
var PanelView = require('./panel_view');

var CORRECTION = 0; // Extra offset from the top

var ContentView = function( panel, config ) {
  PanelView.call(this, panel, config)

  this.tocView = new new TOC(panel.getDocument());

  // scroll to the associated node when clicking onto the outline
  // TODO: make this a dedicated event of the outline
  this.outline.$el.on('click', '.node', _.bind(this._jumpToNode, this));
};

ContentView.Prototype = function() {

  this.render = function() {
    this.tocView.render();
    return this;
  };

  this.getTocView = function() {
    return this.tocView;
  };

  // On Scroll update outline and mark active heading
  // --------
  //

  this.onScroll = function() {
    var scrollTop = this.$el.scrollTop();
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
      this.contentView.$el.scrollTop(topOffset);
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
    var headings = this.panel.getDocument().getHeadings();
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
ContentView.Prototype.prototype = PanelView.prototype;
ContentView.prototype = new ContentView.Prototype();
ContentView.prototype.constructor = ContentView;

module.exports = ContentView;
