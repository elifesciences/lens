
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');

var InlineFormula = function(node, doc) {
  Annotation.call(this, node, doc);
};

InlineFormula.type = {
  id: "inline-formula",
  parent: "annotation",
  properties: {
    target: "formula"
  }
};

InlineFormula.Prototype = function() {};
InlineFormula.Prototype.prototype = Annotation.prototype;
InlineFormula.prototype = new InlineFormula.Prototype();
InlineFormula.prototype.constructor = InlineFormula;

InlineFormula.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(InlineFormula);

module.exports = InlineFormula;
