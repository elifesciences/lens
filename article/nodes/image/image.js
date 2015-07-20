"use strict";

var DocumentNode = require("substance-document").Node;
var WebResource = require("../web_resource").Model;

var ImageNode = function(node, document) {
  WebResource.call(this, node, document);
};

// Type definition
// -----------------
//

ImageNode.type = {
  "id": "image",
  "parent": "webresource",
  "properties": {
    "source_id": "string"
  }
};

// Example Image
// -----------------
//

ImageNode.example = {
  "type": "image",
  "id": "image_1",
  "url": "http://substance.io/image_1.png"
};

// This is used for the auto-generated docs
// -----------------
//


ImageNode.description = {
  "name": "Image",
  "remarks": [
    "Represents a web-resource for an image."
  ],
  "properties": {}
};

ImageNode.Prototype = function() {};

ImageNode.Prototype.prototype = WebResource.prototype;
ImageNode.prototype = new ImageNode.Prototype();
ImageNode.prototype.constructor = ImageNode;

module.exports = ImageNode;
