"use strict";

var Document = require("substance-document");

var DocumentNode = function(node, document) {
  Document.Node.call(this, node, document);
};

DocumentNode.type = {
  "id": "document",
  "parent": "content",
  "properties": {
    "views": ["array", "view"],
    "guid": "string",
    "creator": "string",
    "title": "string",
    "authors": ["array", "contributor"],
    "on_behalf_of": "string",
    "abstract": "string"
  }
};

DocumentNode.Prototype = function() {
};

DocumentNode.Prototype.prototype = Document.Node.prototype;
DocumentNode.prototype = new DocumentNode.Prototype();
DocumentNode.prototype.constructor = DocumentNode;

Document.Node.defineProperties(DocumentNode);

module.exports = DocumentNode;
