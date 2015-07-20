
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');

var ResourceAnnotation = function(node, doc) {
  Annotation.call(this, node, doc);
};

ResourceAnnotation.type = {
  id: "resource_reference",
  parent: "annotation",
  properties: {
    "target": "node"
  }
};

ResourceAnnotation.Prototype = function() {};
ResourceAnnotation.Prototype.prototype = Annotation.prototype;
ResourceAnnotation.prototype = new ResourceAnnotation.Prototype();
ResourceAnnotation.prototype.constructor = ResourceAnnotation;

// Do not fragment this annotation
ResourceAnnotation.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(ResourceAnnotation);

module.exports = ResourceAnnotation;
