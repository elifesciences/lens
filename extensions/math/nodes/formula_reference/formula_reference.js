"use strict";

var Document = require('lens/substance/document');
var LensNodes = require('lens/article/nodes');
var Annotation = LensNodes['annotation'].Model;
var ResourceReference = LensNodes['resource_reference'].Model;

var FormulaReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

FormulaReference.type = {
  id: "figure_reference",
  parent: "resource_reference",
  properties: {
    // formula references have a special addressing scheme:
    // [ envId, formulaId, labelId ]
    // Note: using an array here instead of a nicer object with labeled attributes
    // as this deep referencing could be generalized
    "target": ["array", "string"],
  }
};

FormulaReference.Prototype = function() {

  this.getFormula = function() {
    var target = this.target;
    var node = this.document.get(target[0]);
    if (node.type === "formula") {
      return node;
    } else {
      return this.document.get(target[1]);
    }
  };

};
FormulaReference.Prototype.prototype = ResourceReference.prototype;
FormulaReference.prototype = new FormulaReference.Prototype();
FormulaReference.prototype.constructor = FormulaReference;

// Do not fragment this annotation
FormulaReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(FormulaReference);

module.exports = FormulaReference;
