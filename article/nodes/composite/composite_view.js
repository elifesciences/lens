"use strict";

var NodeView = require("../node").View;

// Substance.Image.View
// ==========================================================================

var CompositeView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
  this.childrenViews = [];
};

CompositeView.Prototype = function() {

  // Rendering
  // =============================
  //

  // Render Markup
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    this.renderChildren();
    return this;
  };

  this.renderChildren = function() {
    var children = this.node.getChildrenIds();
    // create children views
    for (var i = 0; i < children.length; i++) {
      var childView = this.createChildView(children[i]);
      var childViewEl = childView.render().el;
      this.content.appendChild(childViewEl);
    }
  };

  this.dispose = function() {
    NodeView.prototype.dispose.call(this);

    for (var i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }
  };

  this.delete = function() {
  };

  this.getCharPosition = function(/*el, offset*/) {
    return 0;
  };

  this.getDOMPosition = function() {
    var content = this.$('.content')[0];
    var range = document.createRange();
    range.setStartBefore(content.childNodes[0]);
    return range;
  };

  this.createChildView = function(nodeId) {
    var view = this.createView(nodeId);
    this.childrenViews.push(view);
    return view;
  };

};

CompositeView.Prototype.prototype = NodeView.prototype;
CompositeView.prototype = new CompositeView.Prototype();

module.exports = CompositeView;
