"use strict";

var View = require("../../../substance/application").View;
var $$ = require("../../../substance/application").$$;
var Data = require("../../../substance/data");
var Index = Data.Graph.Index;
var _ = require("underscore");

// Substance.TOC.View
// ==========================================================================

var TOCView = function(doc, viewFactory) {
  View.call(this);
  this.doc = doc;
  this.viewFactory = viewFactory;
  this.$el.addClass("toc");
};

TOCView.Prototype = function() {

  // Renderer
  // --------

  this.render = function() {
    var lastLevel = -1;
    var tocNodes = this.doc.getTocNodes();
    // don't render if only 2 sections
    // TODO: this should be decided by the toc panel
    if (tocNodes.length < 2) return this;

    _.each(tocNodes, function(node) {
      var nodeView = this.viewFactory.createView(node);
      var level = node.getLevel();
      if (level === -1) {
        level = lastLevel + 1;
      } else {
        lastLevel = level;
      }
      var el = nodeView.renderTocItem();
      var $el = $(el);
      el.id = "toc_"+node.id;
      // TODO: change 'heading-ref' to 'toc-node'
      $el.addClass('heading-ref');
      $el.addClass('level-' + level);
      $el.click( _.bind( this.onClick, this, node.id ) );
      this.el.appendChild(el);
    }, this);

    return this;
  };

  // Renderer
  // --------
  //

  this.setActiveNode = function(nodeId) {
    this.$('.heading-ref.active').removeClass('active');
    this.$('#toc_'+nodeId).addClass('active');
  };

  this.onClick = function(headingId) {
    this.trigger('toc-item-selected', headingId)
  };
};

TOCView.Prototype.prototype = View.prototype;
TOCView.prototype = new TOCView.Prototype();

module.exports = TOCView;
