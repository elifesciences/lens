"use strict";

var _ = require('underscore');
var Document = require('lens/substance/document');

var EnumerationItem = function(node, doc) {
  Document.Composite.call(this, node, doc);
};

EnumerationItem.type = {
  "id": "enumeration-item", // type name
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "children": ["array", "content"]
  }
};

EnumerationItem.description = {
  "name": "enumeration-item",
  "properties": {
    "label": "Enumeration item label (could be a number for instance)",
    "children": "Children like in a paragraph"
  }
};

EnumerationItem.example = {
  "id": "enum_item_1",
  "type": "enumeration-item",
  "label": "(1)",
  "children": ["text_1"],
};

EnumerationItem.Prototype = function() {
  this.getChildrenIds = function() {
    return _.clone(this.children);
  };
};

EnumerationItem.Prototype.prototype = Document.Composite.prototype;
EnumerationItem.prototype = new EnumerationItem.Prototype();
EnumerationItem.prototype.constructor = EnumerationItem;

Document.Node.defineProperties(EnumerationItem);

module.exports = EnumerationItem;
