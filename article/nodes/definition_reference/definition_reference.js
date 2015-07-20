
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');
var ResourceReference = require('../resource_reference/resource_reference');

var DefinitionReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

DefinitionReference.type = {
  id: "definition_reference",
  parent: "resource_reference",
  properties: {
    "target": "definition"
  }
};

DefinitionReference.Prototype = function() {};
DefinitionReference.Prototype.prototype = ResourceReference.prototype;
DefinitionReference.prototype = new DefinitionReference.Prototype();
DefinitionReference.prototype.constructor = DefinitionReference;

// Do not fragment this annotation
DefinitionReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(DefinitionReference);

module.exports = DefinitionReference;
