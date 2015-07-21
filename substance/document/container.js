"use strict";

var _ = require("underscore");
var util = require("../../substance/util");
var Composite = require("./composite");

var Container = function(document, view) {
  this.document = document;
  this.view = view;

  this.treeView = [];
  this.listView = [];

  this.__parents = {};
  this.__composites = {};

  this.rebuild();
};

Container.Prototype = function() {

  var _each = function(iterator, context) {
    var queue = [];
    var i;

    for (i = this.treeView.length - 1; i >= 0; i--) {
      queue.unshift({
        id: this.treeView[i],
        parent: null
      });
    }

    var item, node;
    while(queue.length > 0) {
      item = queue.shift();
      node = this.document.get(item.id);
      if (node instanceof Composite) {
        var children = node.getNodes();
        for (i = children.length - 1; i >= 0; i--) {
          queue.unshift({
            id: children[i],
            parent: node.id,
          });
        }
      }
      iterator.call(context, node, item.parent);
    }
  };

  this.rebuild = function() {

    // clear the list view
    this.treeView.splice(0, this.treeView.length);
    this.listView.splice(0, this.listView.length);

    this.treeView = _.clone(this.view.nodes);
    for (var i = 0; i < this.view.length; i++) {
      this.treeView.push(this.view[i]);
    }

    this.__parents = {};
    this.__composites = {};
    _each.call(this, function(node, parent) {
      if (node instanceof Composite) {
        this.__parents[node.id] = parent;
        this.__composites[parent] = parent;
      } else {
        this.listView.push(node.id);
        if (this.__parents[node.id]) {
          throw new Error("Nodes must be unique in one view.");
        }
        this.__parents[node.id] = parent;
        this.__composites[parent] = parent;
      }
    }, this);
  };

  this.getTopLevelNodes = function() {
    return _.map(this.treeView, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getNodes = function(idsOnly) {
    var nodeIds = this.listView;
    if (idsOnly) {
      return _.clone(nodeIds);
    }
    else {
      var result = [];
      for (var i = 0; i < nodeIds.length; i++) {
        result.push(this.document.get(nodeIds[i]));
      }
      return result;
    }
  };

  this.getPosition = function(nodeId) {
    var nodeIds = this.listView;
    return nodeIds.indexOf(nodeId);
  };

  this.getNodeFromPosition = function(pos) {
    var nodeIds = this.listView;
    var id = nodeIds[pos];
    if (id !== undefined) {
      return this.document.get(id);
    } else {
      return null;
    }
  };

  this.getParent = function(nodeId) {
    return this.__parents[nodeId];
  };

  // Get top level parent of given nodeId
  this.getRoot = function(nodeId) {
    var parent = nodeId;

    // Always use top level element for referenceing the node
    while (parent) {
      nodeId = parent;
      parent = this.getParent(nodeId);
    }
    return nodeId;
  };

  this.update = function(op) {
    var path = op.path;
    var needRebuild = (path[0] === this.view.id ||  this.__composites[path[0]] !== undefined);
    if (needRebuild) this.rebuild();
  };

  this.getLength = function() {
    return this.listView.length;
  };

  // Returns true if there is another node after a given position.
  // --------
  //

  this.hasSuccessor = function(nodePos) {
    var l = this.getLength();
    return nodePos < l - 1;
  };

  // Returns true if given view and node pos has a predecessor
  // --------
  //

  this.hasPredecessor = function(nodePos) {
    return nodePos > 0;
  };

  // Get predecessor node for a given view and node id
  // --------
  //

  this.getPredecessor = function(id) {
    var pos = this.getPosition(id);
    if (pos <= 0) return null;
    return this.getNodeFromPosition(pos-1);
  };

  // Get successor node for a given view and node id
  // --------
  //

  this.getSuccessor = function(id) {
    var pos = this.getPosition(id);
    if (pos >= this.getLength() - 1) return null;
    return this.getNodeFromPosition(pos+1);
  };

  this.firstChild = function(node) {
    if (node instanceof Composite) {
      var first = this.document.get(node.getNodes()[0]);
      return this.firstChild(first);
    } else {
      return node;
    }
  };

  this.lastChild = function(node) {
    if (node instanceof Composite) {
      var last = this.document.get(_.last(node.getNodes()));
      return this.lastChild(last);
    } else {
      return node;
    }
  };

  // Provides a document position which addresses begin of a given node
  // --------
  //

  this.before = function(node) {
    var child = this.firstChild(node);
    var nodePos = this.getPosition(child.id);
    return [nodePos, 0];
  };

  // Provides a document position which addresses the end of a given node
  // --------
  //

  this.after = function(node) {
    var child = this.lastChild(node);
    var nodePos = this.getPosition(child.id);
    var charPos = child.getLength();
    return [nodePos, charPos];
  };

};

Container.prototype = _.extend(new Container.Prototype(), util.Events.Listener);

Object.defineProperties(Container.prototype, {
  "id": {
    get: function() { return this.view.id; }
  },
  "type": {
    get: function() { return this.view.type; }
  },
  "nodes": {
    get: function() { return this.view.nodes; },
    set: function(val) { this.view.nodes = val; }
  }
});

module.exports = Container;
