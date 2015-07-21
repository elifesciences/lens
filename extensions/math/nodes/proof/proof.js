"use strict";

var Document = require('lens/substance/document');
var Composite = Document.Composite;

// Lens.Proof
// -----------------
//

var Proof = function(node, doc) {
  Composite.call(this, node, doc);
};

// Type definition
// -----------------
//

Proof.type = {
  "id": "proof",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "children": ["array", "paragraph"]
  }
};

// This is used for the auto-generated docs
// -----------------
//

Proof.description = {
  "name": "Proof",
  "remarks": [
    "Models a proof section in a math article",
  ],
  "properties": {
    "label": "string",
    "children": "0..n Paragraph nodes",
  }
};


// Example Proof
// -----------------
//

Proof.example = {
  "id": "proof_1",
  "type": "proof",
  "label": "Proof.",
  "children": ["paragraph_1", "paragraph_2"]
};

Proof.Prototype = function() {

  this.getChildrenIds = function() {
    return this.properties.children;
  };

};

Proof.Prototype.prototype = Composite.prototype;
Proof.prototype = new Proof.Prototype();
Proof.prototype.constructor = Proof;

Document.Node.defineProperties(Proof);

module.exports = Proof;
