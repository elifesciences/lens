"use strict";

var LensNodes = require('lens/article/nodes');
var LensCitationView =  LensNodes['citation'].View;



var CitationView = function() {
  LensCitationView.apply(this, arguments);
};

CitationView.Prototype = function() {
  this.getHeader = function() {
    var authors = this.node.properties.authors;
    var label = this.node.properties.label;
    if (authors.length > 2) {
      return label +" - " + authors[0] + " et al.";
    } else {
      return label +" - " + authors.join(", ");
    }
  };
};

CitationView.Prototype.prototype = LensCitationView.prototype;
CitationView.prototype = new CitationView.Prototype();
CitationView.prototype.constructor = CitationView;

module.exports = CitationView;
