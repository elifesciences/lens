"use strict";

var Document = require('../../../substance/document');
var Composite = Document.Composite;

// Lens.Quote
// -----------------
//

var Quote = function(node, doc) {
    Composite.call(this, node, doc);
};

// Type definition
// -----------------
//

Quote.type = {
  "id": "quote",
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

Quote.description = {
  "name": "Quote",
  "remarks": ["A quote type."],
  "properties": {
    "label": "string",
    "children": "0..n Paragraph nodes"
  }
};


// Example Quote
// -----------------
//

Quote.example = {
  "id": "quote_1",
  "type": "quote",
  "label": "Quote 1",
  "children": ["paragraph_1", "paragraph_2"]
};

Quote.Prototype = function() {

  this.getChildrenIds = function() {
    return this.properties.children;
  };

};

Quote.Prototype.prototype = Composite.prototype;
Quote.prototype = new Quote.Prototype();
Quote.prototype.constructor = Quote;

Document.Node.defineProperties(Quote);

module.exports = Quote;
