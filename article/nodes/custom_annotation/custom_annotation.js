
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');

var Custom = function(node, doc) {
  Annotation.call(this, node, doc);
};

Custom.type = {
  id: "custom_annotation",
  parent: "annotation",
  properties: {
    name: 'string'
  }
};

Custom.Prototype = function() {};
Custom.Prototype.prototype = Annotation.prototype;
Custom.prototype = new Custom.Prototype();
Custom.prototype.constructor = Custom;

Custom.fragmentation = Annotation.DONT_CARE;

Document.Node.defineProperties(Custom);

module.exports = Custom;
