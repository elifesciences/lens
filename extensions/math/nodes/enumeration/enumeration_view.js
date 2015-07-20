"use strict";

var LensNodes = require('lens/article/nodes');
var NodeView = LensNodes['node'].View;
var CompositeView = LensNodes['composite'].View;

// Substance.Image.View
// ==========================================================================

var EnumerationView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

EnumerationView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    this.renderChildren();

    this.el.appendChild(this.content);

    return this;
  };
};

EnumerationView.Prototype.prototype = CompositeView.prototype;
EnumerationView.prototype = new EnumerationView.Prototype();

module.exports = EnumerationView;
