"use strict";

var LensNodes = require('lens/article/nodes');
var NodeView = LensNodes["node"].View;
var CompositeView = LensNodes["composite"].View;
var $$ = require("lens/substance/application").$$;


// Lens.Proof.View
// ==========================================================================

var ProofView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

ProofView.Prototype = function() {

  // Render it
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    if (this.node.label) {
      var labelEl = $$('span.proof-label', {
        text: this.node.label
      });
      this.content.appendChild(labelEl);
    }

    this.renderChildren();

    this.el.appendChild(this.content);

    return this;
  };
};

ProofView.Prototype.prototype = CompositeView.prototype;
ProofView.prototype = new ProofView.Prototype();

module.exports = ProofView;
