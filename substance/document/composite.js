var DocumentNode = require("./node");

var Composite = function(node, doc) {
  DocumentNode.call(this, node, doc);
};

// Type definition
// -----------------
//

Composite.type = {
  "id": "composite",
  "parent": "content",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Composite.description = {
  "name": "Composite",
  "remarks": [
    "A file reference to an external resource.",
  ],
  "properties": {
  }
};

// Example File
// -----------------
//

Composite.example = {
  "no_example": "yet"
};

Composite.Prototype = function() {

  this.getLength = function() {
    throw new Error("Composite.getLength() is abstract.");
  };

  // Provides the ids of all referenced sub-nodes.
  // -------
  //

  // Only for legacy reasons
  this.getNodes = function() {
    return this.getChildrenIds();
  };

  this.getChildrenIds = function() {
    throw new Error("Composite.getChildrenIds() is abstract.");
  };

  // Tells if this composite is can be changed with respect to its children
  // --------
  //

  this.isMutable = function() {
    return false;
  };

  this.insertOperation = function(/*charPos, text*/) {
    return null;
  };

  this.deleteOperation = function(/*startChar, endChar*/) {
    return null;
  };

  // Inserts reference(s) at the given position
  // --------
  //

  this.insertChild = function(/*doc, pos, nodeId*/) {
    throw new Error("This composite is immutable.");
  };

  // Removes a reference from this composite.
  // --------

  this.deleteChild = function(/*doc, nodeId*/) {
    throw new Error("This composite is immutable.");
  };

  // Provides the index of the affected node.
  // --------
  //

  this.getChangePosition = function(op) {
    return 0;
  };

};

Composite.Prototype.prototype = DocumentNode.prototype;
Composite.prototype = new Composite.Prototype();

module.exports = Composite;
