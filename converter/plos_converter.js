"use strict";

// Experimal
// --------------------
// 
// Citations are not extracted accordingly. 
// Also we need to normalize id's as they are not compatible with data-properties
// data-id="pone.0113605-Mathews1" is invalid
// 

var util = require("substance-util");
var _ = require("underscore");
var LensConverter = require('./lens_converter');

var PLOSConverter = function(options) {
  LensConverter.call(this, options);
};

PLOSConverter.Prototype = function() {

  var __super__ = LensConverter.prototype;

  this.test = function(xmlDoc, documentUrl) {
    var publisherName = xmlDoc.querySelector("publisher-name").textContent;
    return publisherName === "Public Library of Science";
  };

  // Resolve figure urls
  // --------
  // 

  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");

    url = [
      "http://www.plosone.org/article/fetchObject.action?uri=",
      url,
      "&representation=PNG_L"
    ].join('');
    node.url = url;
  };

};

PLOSConverter.Prototype.prototype = LensConverter.prototype;
PLOSConverter.prototype = new PLOSConverter.Prototype();
PLOSConverter.prototype.constructor = PLOSConverter;

module.exports = PLOSConverter;
