"use strict";

var _ = require('underscore');
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;
var ResourceView = require('../../resource_view');

// Lens.Definition.View
// ==========================================================================

var DefinitionView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};


DefinitionView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    this.content.appendChild($$('.description', {text: this.node.description }));
  };

};

DefinitionView.Prototype.prototype = NodeView.prototype;
DefinitionView.prototype = new DefinitionView.Prototype();
DefinitionView.prototype.constructor = DefinitionView;

module.exports = DefinitionView;
