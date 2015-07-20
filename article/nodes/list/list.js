"use strict";

var _ = require("underscore");
var Document = require('../../../substance/document');
var DocumentNode = Document.Node;
var Composite = Document.Composite;

var List = function(node, document) {
  Composite.call(this, node, document);
};

List.type = {
  "id": "list",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "items": ["array", "paragraph"],
    "ordered": "boolean"
  }
};


// This is used for the auto-generated docs
// -----------------
//

List.description = {
  "name": "List",
  "remarks": [
    "Lists can either be numbered or bullet lists"
  ],
  "properties": {
    "ordered": "Specifies wheter the list is ordered or not",
    "items": "An array of paragraph references",
  }
};


// Example Formula
// -----------------
//

List.example = {
  "type": "list",
  "id": "list_1",
  "items ": [
    "paragraph_listitem_1",
    "paragraph_listitem_2",
  ]
};

List.Prototype = function() {

  this.getLength = function() {
    return this.properties.items.length;
  };

  this.getChildrenIds = function() {
    return _.clone(this.items);
  };

  this.getItems = function() {
    return _.map(this.properties.items, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getChangePosition = function(op) {
    if (op.path[1] === "items") {

      if (op.type === "update") {
        var diff = op.diff;
        if (diff.isInsert()) {
          return op.diff.pos+1;
        }
        else if (diff.isDelete()) {
          return op.diff.pos;
        }
        else if (diff.isMove()) {
          return op.diff.target;
        }
      }
      else if (op.type === "set") {
        return this.properties.items.length-1;
      }
    }

    return -1;
  };

  this.isMutable = function() {
    return true;
  };

  this.insertChild = function(doc, pos, nodeId) {
    doc.update([this.id, "items"], ["+", pos, nodeId]);
  };

  this.deleteChild = function(doc, nodeId) {
    var pos = this.items.indexOf(nodeId);
    doc.update([this.id, "items"], ["-", pos, nodeId]);
    doc.delete(nodeId);
  };

  this.canJoin = function(other) {
    return (other.type === "list");
  };

  this.isBreakable = function() {
    return true;
  };

  this.break = function(doc, childId, charPos) {
    var childPos = this.properties.items.indexOf(childId);
    if (childPos < 0) {
      throw new Error("Unknown child " + childId);
    }
    var child = doc.get(childId);
    var newNode = child.break(doc, charPos);
    doc.update([this.id, "items"], ["+", childPos+1, newNode.id]);
    return newNode;
  };

};

List.Prototype.prototype = Composite.prototype;
List.prototype = new List.Prototype();
List.prototype.constructor = List;

DocumentNode.defineProperties(List.prototype, ["items", "ordered"]);

module.exports = List;
