
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');
var ResourceReference = require('../resource_reference/resource_reference');

var FigureReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

FigureReference.type = {
  id: "figure_reference",
  parent: "resource_reference",
  properties: {
    "target": "figure"
  }
};

FigureReference.Prototype = function() {};
FigureReference.Prototype.prototype = ResourceReference.prototype;
FigureReference.prototype = new FigureReference.Prototype();
FigureReference.prototype.constructor = FigureReference;

// Do not fragment this annotation
FigureReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(FigureReference);

module.exports = FigureReference;
