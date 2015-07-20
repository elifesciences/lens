"use strict";

var Document = require("substance-document");
var DocumentNode = Document.Node;
var Paragraph = require('../paragraph').Model;


var Footnote = function(node, document) {
  Paragraph.call(this, node, document);
};

Footnote.type = {
  "id": "footnote",
  "parent": "paragraph",
  "properties": {
    "label": "string"
  }
};

// This is used for the auto-generated docs
// -----------------
//

Footnote.description = {
  "name": "Footnote",
  "remarks": [
    "A Footnote is basically a Paragraph with a label."
  ],
  "properties": {
    "label": "A string used as label",
  }
};

// Example
// -------
//

Footnote.example = {
  "type": "footnote",
  "id": "footnote_1",
  "label": "a",
  "children ": [
    "text_1",
    "image_1",
    "text_2"
  ]
};

Footnote.Prototype = function() {

};

Footnote.Prototype.prototype = Paragraph.prototype;
Footnote.prototype = new Footnote.Prototype();
Footnote.prototype.constructor = Footnote;

DocumentNode.defineProperties(Footnote);

module.exports = Footnote;
