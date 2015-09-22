"use strict";

var Document = require('../../../substance/document');
var Composite = Document.Composite;

// Lens.Quotation
// -----------------
//

var Quotation = function(node, doc) {
  Composite.call(this, node, doc);
};

// Type definition
// -----------------
//

Quotation.type = {
  "id": "quotation",
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

Quotation.description = {
  "name": "Quotation",
  "remarks": [
    "A quotation type.",
  ],
  "properties": {
    "label": "string",
    "children": "0..n Paragraph nodes",
  }
};


// Example Quotation
// -----------------
//

Quotation.example = {
  "id": "quotation_1",
  "type": "quotation",
  "label": "Quotation 1",
  "children": ["paragraph_1", "paragraph_2"]
};

Quotation.Prototype = function() {

  this.getChildrenIds = function() {
    return this.properties.children;
  };

};

Quotation.Prototype.prototype = Composite.prototype;
Quotation.prototype = new Quotation.Prototype();
Quotation.prototype.constructor = Quotation;

Document.Node.defineProperties(Quotation);

module.exports = Quotation;
