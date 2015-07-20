"use strict";

// Note: we leave the Node in `substance-document` as it is an essential part of the API.
var Document = require("substance-document");

var Node = Document.Node;

// This is used for the auto-generated docs
// -----------------
//

Node.description = {
  "name": "Node",
  "remarks": [
    "Abstract node type."
  ],
  "properties": {
    "source_id": "Useful for document conversion where the original id of an element should be remembered.",
  }
};

// Example
// -------
//

module.exports = Node;
