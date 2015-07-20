"use strict";

var DocumentNode = require("substance-document").Node;
var Text = require("../text/text_node");

var Heading = function(node, document) {
  Text.call(this, node, document);
};

// Type definition
// -----------------
//

Heading.type = {
  "id": "heading",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "content": "string",
    "label": "string",
    "level": "number"
  }
};

// Example Heading
// -----------------
//

Heading.example = {
  "type": "heading",
  "id": "heading_1",
  "content": "Introduction",
  "level": 1
};

// This is used for the auto-generated docs
// -----------------
//


Heading.description = {
  "name": "Heading",
  "remarks": [
    "Denotes a section or sub section in your article."
  ],
  "properties": {
    "content": "Heading title",
    "label": "Heading label",
    "level": "Heading level. Ranges from 1..4"
  }
};

Heading.Prototype = function() {

  this.splitInto = 'paragraph';

  // TOC API

  this.includeInToc = function() {
    return true;
  };

  this.getLevel = function() {
    return this.level;
  }

};

Heading.Prototype.prototype = Text.prototype;
Heading.prototype = new Heading.Prototype();
Heading.prototype.constructor = Heading;

DocumentNode.defineProperties(Heading);

module.exports = Heading;
