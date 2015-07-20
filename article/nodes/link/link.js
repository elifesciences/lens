
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');

var Link = function(node, doc) {
  Annotation.call(this, node, doc);
};

Link.type = {
  id: "link",
  parent: "annotation",
  properties: {
    "url": "string"
  }
};

Link.Prototype = function() {};
Link.Prototype.prototype = Annotation.prototype;
Link.prototype = new Link.Prototype();
Link.prototype.constructor = Link;

// Do not fragment this annotation
Link.fragmentation = Annotation.NEVER;

Document.Node.defineProperties(Link);

module.exports = Link;
