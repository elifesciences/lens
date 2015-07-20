"use strict";

var Document = require('lens/substance/document');
var LensNodes = require('lens/article/nodes');
var Annotation = LensNodes['annotation'].Model;
var ResourceReference = LensNodes['resource_reference'].Model;

var MathEnvironmentReference = function(node, doc) {
  ResourceReference.call(this, node, doc);
};

MathEnvironmentReference.type = {
  id: "math_environment_reference",
  parent: "resource_reference",
  properties: {
    "target": "math_environment",
  }
};

MathEnvironmentReference.Prototype = function() {};
MathEnvironmentReference.Prototype.prototype = ResourceReference.prototype;
MathEnvironmentReference.prototype = new MathEnvironmentReference.Prototype();
MathEnvironmentReference.prototype.constructor = MathEnvironmentReference;

// Do not fragment this annotation
MathEnvironmentReference.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(MathEnvironmentReference);

module.exports = MathEnvironmentReference;
