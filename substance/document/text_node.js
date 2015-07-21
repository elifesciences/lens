"use strict";

var DocumentNode = require("./node");

// Substance.Text
// -----------------
//

var Text = function(node, document) {
  DocumentNode.call(this, node, document);
};


Text.type = {
  "id": "text",
  "parent": "content",
  "properties": {
    "source_id": "Text element source id",
    "content": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Text.description = {
  "name": "Text",
  "remarks": [
    "A simple text fragement that can be annotated. Usually text nodes are combined in a paragraph.",
  ],
  "properties": {
    "content": "Content",
  }
};


// Example Paragraph
// -----------------
//

Text.example = {
  "type": "paragraph",
  "id": "paragraph_1",
  "content": "Lorem ipsum dolor sit amet, adipiscing elit.",
};


Text.Prototype = function() {
  this.getLength = function() {
    return this.properties.content.length;
  };
};

Text.Prototype.prototype = DocumentNode.prototype;
Text.prototype = new Text.Prototype();
Text.prototype.constructor = Text;

DocumentNode.defineProperties(Text.prototype, ["content"]);

module.exports = Text;
