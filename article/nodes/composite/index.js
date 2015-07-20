"use strict";

var Document = require("substance-document");

module.exports = {
  Model: Document.Composite,
  View: require("./composite_view")
};
