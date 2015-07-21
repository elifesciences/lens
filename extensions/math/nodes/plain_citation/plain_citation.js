"use strict";

var Document = require('lens/substance/document');

var PlainCitation = function(node, doc) {
  Document.Node.call(this, node, doc);
};

PlainCitation.type = {
  "id": "plain_citation", // type name
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "authors": ["array", "string"],
    "raw_formats": ["array", "object"],
    "content": "string"
  }
};

PlainCitation.Prototype = function() {
  this.getRawFormatForType = function(type) {
    return this.raw_formats[0].content;
  };
};

PlainCitation.Prototype.prototype = Document.Node.prototype;
PlainCitation.prototype = new PlainCitation.Prototype();
PlainCitation.prototype.constructor = PlainCitation;

Document.Node.defineProperties(PlainCitation);

module.exports = PlainCitation;
