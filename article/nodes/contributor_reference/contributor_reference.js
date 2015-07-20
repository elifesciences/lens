

var Document = require('substance-document');
var Annotation = require('../annotation/annotation');
var ResourceReference = require('../resource_reference/resource_reference');

var ContributorReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

ContributorReference.type = {
  id: "contributor_reference",
  parent: "resource_reference",
  properties: {
    "target": "contributor"
  }
};

ContributorReference.Prototype = function() {};
ContributorReference.Prototype.prototype = ResourceReference.prototype;
ContributorReference.prototype = new ContributorReference.Prototype();
ContributorReference.prototype.constructor = ContributorReference;

// Do not fragment this annotation
ContributorReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(ContributorReference);

module.exports = ContributorReference;
