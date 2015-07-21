"use strict";

var ResourceReferenceView = require('../resource_reference').View;

var InlineFormulaView = function(node, viewFactory) {
  ResourceReferenceView.call(this, node, viewFactory);
  $(this.el).removeClass('resource-reference');
};

InlineFormulaView.Prototype = function() {

  this.createElement = function() {
    var el = document.createElement('span');
    return el;
  };

  this.render = function() {
    var formula = this.node.document.get(this.node.target);
    var formulaView = this.viewFactory.createView(formula);
    this.el.innerHTML = formulaView.render().el.innerHTML;
    return this;
  };

};
InlineFormulaView.Prototype.prototype = ResourceReferenceView.prototype;
InlineFormulaView.prototype = new InlineFormulaView.Prototype();

module.exports = InlineFormulaView;
