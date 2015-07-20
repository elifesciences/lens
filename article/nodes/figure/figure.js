"use strict";

var Document = require("substance-document");

var Figure = function(node, document) {
  Document.Composite.call(this, node, document);
};


Figure.type = {
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "caption": "caption",
    "position": "string", // 'float': default;figure goes into figure panel | 'anchor': figure is rendered in-flow
    "attrib": "string"
  }
};

Figure.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Figure.description = {
  "name": "Figure",
  "remarks": [
    "A figure is a figure is figure.",
  ],
  "properties": {
    "label": "Label used as header for the figure cards",
    "url": "Image url",
    "caption": "A reference to a caption node that describes the figure",
    "attrib": "Figure attribution"
  }
};

// Example File
// -----------------
//

Figure.example = {
  "id": "figure_1",
  "label": "Figure 1",
  "url": "http://example.com/fig1.png",
  "caption": "caption_1"
};

Figure.Prototype = function() {

  this.hasCaption = function() {
    return (!!this.properties.caption);
  };

  this.getChildrenIds = function() {
    var nodes = [];
    if (this.properties.caption) {
      nodes.push(this.properties.caption);
    }
    return nodes;
  };

  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };

  this.getHeader = function() {
    return this.properties.label;
  };
};

Figure.Prototype.prototype = Document.Composite.prototype;
Figure.prototype = new Figure.Prototype();
Figure.prototype.constructor = Figure;

Document.Node.defineProperties(Figure.prototype, Object.keys(Figure.type.properties));

module.exports = Figure;
