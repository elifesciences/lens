"use strict";

var LensNodes = require("lens/article/nodes");
var CoverModel = LensNodes["cover"].Model;

module.exports = {
  Model: CoverModel,
  View: require('./cover_view')
};