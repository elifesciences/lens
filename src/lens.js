"use strict";

var _ = require("underscore");

var Lens = {
  Article: require("lens-article")
};

var Substance = {
  util: require("substance-util"),
  Test: require("substance-test"),
  Application: require("substance-application"),
  Commander: require("substance-commander"),
  Document: require("substance-document"),
  Operator: require("substance-operator"),
  Chronicle: require("substance-chronicle"),
  Data: require("substance-data"),
  RegExp: require("substance-regexp"),
  Surface: require("substance-surface")
};

// Register node types
// TODO: that should be done smarter
Substance.Document.Transformer.nodeTypes = {
  "node": require('lens-article/nodes/node'),
  "constructor": require('lens-article/nodes/constructor'),
  "paragraph": require('lens-article/nodes/paragraph'),
  "heading": require('lens-article/nodes/heading'),
  "image": require('lens-article/nodes/image'),
  "codeblock": require('lens-article/nodes/codeblock')
};

// require("substance-operator/tests");
// require("substance-chronicle/tests");
// require("substance-data/tests");
// require("substance-article/tests");
// require("substance-store/tests");
// require("substance-surface/tests");

Lens.Substance = Substance;

module.exports = Lens;
