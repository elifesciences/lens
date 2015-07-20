"use strict";

var LensNodes = require('lens/article/nodes');
var DocumentNode = LensNodes['node'].Model;

var MathEnvironment = function(node, document) {
  DocumentNode.call(this, node, document);
};

MathEnvironment.type = {
  "parent": "content",
  "properties": {
    "source_id": "string",
    "envType": "string",
    "label": "string",
    "comment": "string",
    "body": ["array", "paragraph"]
  }
};

MathEnvironment.Prototype = function() {

  this.includeInToc = function() {
    return this.properties.envType === "thmplain";
  };

  this.getLevel = function() {
    // Note: -1 means that it is always treated as a sub-section of the last section
    return -1;
  };

};

MathEnvironment.Prototype.prototype = DocumentNode.prototype;
MathEnvironment.prototype = new MathEnvironment.Prototype();
MathEnvironment.prototype.constructor = MathEnvironment;

DocumentNode.defineProperties(MathEnvironment);

module.exports = MathEnvironment;
