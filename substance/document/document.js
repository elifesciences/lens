"use strict";

// Substance.Document 0.5.0
// (c) 2010-2013 Michael Aufreiter
// Substance.Document may be freely distributed under the MIT license.
// For all details and documentation:
// http://interior.substance.io/modules/document.html


// Import
// ========

var _ = require("underscore");
var util = require("../../substance/util");
var errors = util.errors;
var Data = require("../../substance/data");
//var Operator = require("substance-operator");
//var Chronicle = require("substance-chronicle");
var Container = require("./container");

// Module
// ========

var DocumentError = errors.define("DocumentError");


// Document
// --------
//
// A generic model for representing and transforming digital documents

var Document = function(options) {
  Data.Graph.call(this, options.schema, options);

  this.containers = {};

  this.addIndex("annotations", {
    types: ["annotation"],
    property: "path"
  });
};

// Default Document Schema
// --------

Document.schema = {
  // Static indexes
  "indexes": {
  },

  "types": {
    // Specific type for substance documents, holding all content elements
    "content": {
      "properties": {
      }
    },

    "view": {
      "properties": {
        "nodes": ["array", "content"]
      }
    }
  }
};


Document.Prototype = function() {
  var __super__ = util.prototype(this);

  this.getIndex = function(name) {
    return this.indexes[name];
  };

  this.getSchema = function() {
    return this.schema;
  };

  this.create = function(node) {
    __super__.create.call(this, node);
    return this.get(node.id);
  };

  // Delegates to Graph.get but wraps the result in the particular node constructor
  // --------
  //

  this.get = function(path) {
    var node = __super__.get.call(this, path);

    if (!node) return node;

    // Wrap all views in Container instances
    if (node.type === "view") {
      if (!this.containers[node.id]) {
        this.containers[node.id] = new Container(this, node);
      }
      return this.containers[node.id];
    }

    // Wrap all nodes in an appropriate Node instance
    else {
      var nodeSpec = this.nodeTypes[node.type];
      var NodeType = (nodeSpec !== undefined) ? nodeSpec.Model : null;
      if (NodeType && !(node instanceof NodeType)) {
        node = new NodeType(node, this);
        this.nodes[node.id] = node;
      }

      return node;
    }
  };

  // Serialize to JSON
  // --------
  //
  // The command is converted into a sequence of graph commands

  this.toJSON = function() {
    var res = __super__.toJSON.call(this);
    res.id = this.id;
    return res;
  };

  // Hide elements from provided view
  // --------
  //

  this.hide = function(viewId, nodes) {
    var view = this.get(viewId);

    if (!view) {
      throw new DocumentError("Invalid view id: "+ viewId);
    }

    if (_.isString(nodes)) {
      nodes = [nodes];
    }

    var indexes = [];
    _.each(nodes, function(n) {
      var i = view.nodes.indexOf(n);
      if (i>=0) indexes.push(i);
    }, this);

    if (indexes.length === 0) return;

    indexes = indexes.sort().reverse();
    indexes = _.uniq(indexes);

    var container = this.nodes[viewId];
    for (var i = 0; i < indexes.length; i++) {
      container.nodes.splice(indexes[i], 1);
    }
  };

  // Adds nodes to a view
  // --------
  //

  this.show = function(viewId, nodeId, target) {
    if (target === undefined) target = -1;

    var view = this.get(viewId);
    if (!view) {
      throw new DocumentError("Invalid view id: " + viewId);
    }

    var l = view.nodes.length;

    // target index can be given as negative number (as known from python/ruby)
    target = Math.min(target, l);
    if (target<0) target = Math.max(0, l+target+1);

    view.nodes.splice(target, 0, nodeId);
  };

  this.fromSnapshot = function(data, options) {
    return Document.fromSnapshot(data, options);
  };

  this.uuid = function(type) {
    return type + "_" + util.uuid();
  };
};

Document.Prototype.prototype = Data.Graph.prototype;
Document.prototype = new Document.Prototype();

Document.fromSnapshot = function(data, options) {
  options = options || {};
  options.seed = data;
  return new Document(options);
};


Document.DocumentError = DocumentError;

// Export
// ========

module.exports = Document;
