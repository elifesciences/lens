"use strict";

var _ = require("underscore");
var Document = require("lens/substance/document");
var DocumentNode = Document.Node;
var Composite = Document.Composite;

var Enumeration = function(node, document) {
  Composite.call(this, node, document);
};

Enumeration.type = {
  "id": "enumeration",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "items": ["array", "enumeration-item"]
  }
};


// This is used for the auto-generated docs
// -----------------
//

Enumeration.description = {
  "name": "enumeration",
  "remarks": [
    "Enumerations are lists with labeled items"
  ],
  "properties": {
    "items": "An array of enumeration items",
  }
};


// Example Formula
// -----------------
//

Enumeration.example = {
  "type": "enumeration",
  "id": "enumeration_1",
  "items ": [
    "enumeration-item_1",
    "enumeration-item_2",
  ]
};

Enumeration.Prototype = function() {

  this.getChildrenIds = function() {
    return _.clone(this.items);
  };

};

Enumeration.Prototype.prototype = Composite.prototype;
Enumeration.prototype = new Enumeration.Prototype();
Enumeration.prototype.constructor = Enumeration;

DocumentNode.defineProperties(Enumeration);

module.exports = Enumeration;
