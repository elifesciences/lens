
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');
var ResourceReference = require('../resource_reference/resource_reference');

var CitationReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

CitationReference.type = {
  id: "citation_reference",
  parent: "resource_reference",
  properties: {
    "target": "citation"
  }
};

CitationReference.Prototype = function() {};
CitationReference.Prototype.prototype = ResourceReference.prototype;
CitationReference.prototype = new CitationReference.Prototype();
CitationReference.prototype.constructor = CitationReference;

// Do not fragment this annotation
CitationReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(CitationReference);

module.exports = CitationReference;
