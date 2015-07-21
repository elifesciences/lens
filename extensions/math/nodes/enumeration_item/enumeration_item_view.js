"use strict";

var LensNodes = require("lens/article/nodes");
var $$ = require("lens/substance/application").$$;
var NodeView = LensNodes["node"].View;
var CompositeView = LensNodes["composite"].View;

// Lens.Cover.View
// ==========================================================================

var EnumerationItemView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

EnumerationItemView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    var $content = $(this.content);
    var labelView = this.createTextPropertyView([this.node.id, 'label'], {
      classes: 'enum-label'
    });
    var labelEl = labelView.render().el;
    this.content.appendChild(labelEl);

    this.renderChildren();

    return this;
  };

  this.renderChildren = function() {
    var children = this.node.getChildrenIds();

    this.body = $$('.enum-body');
    this.content.appendChild(this.body);

    // create children views
    for (var i = 0; i < children.length; i++) {
      var childView = this.createChildView(children[i]);
      var childViewEl = childView.render().el;
      this.body.appendChild(childViewEl);
    }
  };
};

EnumerationItemView.Prototype.prototype = CompositeView.prototype;
EnumerationItemView.prototype = new EnumerationItemView.Prototype();

module.exports = EnumerationItemView;
