"use strict";

var Document = require('substance-document');
var Composite = Document.Composite;

// Lens.Box
// -----------------
//

var Box = function(node, doc) {
  Composite.call(this, node, doc);
};

// Type definition
// -----------------
//

Box.type = {
  "id": "box",
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

Box.description = {
  "name": "Box",
  "remarks": [
    "A box type.",
  ],
  "properties": {
    "label": "string",
    "children": "0..n Paragraph nodes",
  }
};


// Example Box
// -----------------
//

Box.example = {
  "id": "box_1",
  "type": "box",
  "label": "Box 1",
  "children": ["paragraph_1", "paragraph_2"]
};

Box.Prototype = function() {

  this.getChildrenIds = function() {
    return this.properties.children;
  };

};

Box.Prototype.prototype = Composite.prototype;
Box.prototype = new Box.Prototype();
Box.prototype.constructor = Box;

Document.Node.defineProperties(Box);

module.exports = Box;
