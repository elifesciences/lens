"use strict";

var NodeView = require('../node').View;
var CompositeView = require("../composite").View;
var $$ = require("../../../substance/application").$$;

// Lens.Quotation.View
// ==========================================================================

var QuotationView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

QuotationView.Prototype = function() {


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

QuotationView.Prototype.prototype = CompositeView.prototype;
QuotationView.prototype = new QuotationView.Prototype();

module.exports = QuotationView;
