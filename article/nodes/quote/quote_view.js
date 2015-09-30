"use strict";

var NodeView = require('../node').View;
var CompositeView = require("../composite").View;
var $$ = require("../../../substance/application").$$;

// Lens.Quote.View
// ==========================================================================

var QuoteView = function(node, viewFactory) {
    CompositeView.call(this, node, viewFactory);
};

QuoteView.Prototype = function() {

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

QuoteView.Prototype.prototype = CompositeView.prototype;
QuoteView.prototype = new QuoteView.Prototype();

module.exports = QuoteView;
