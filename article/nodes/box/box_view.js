"use strict";

var NodeView = require('../node').View;
var CompositeView = require("../composite").View;
var $$ = require("substance-application").$$;


// Lens.Box.View
// ==========================================================================

var BoxView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

BoxView.Prototype = function() {

  // Render it
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    if (this.node.label) {
      var labelEl = $$('.label', {
        text: this.node.label
      });
      this.content.appendChild(labelEl);
    }

    this.renderChildren();

    this.el.appendChild(this.content);

    return this;
  };
};

BoxView.Prototype.prototype = CompositeView.prototype;
BoxView.prototype = new BoxView.Prototype();

module.exports = BoxView;
