
var Annotation = require('../annotation/annotation');

var Underline = function(node, doc) {
  Annotation.call(this, node, doc);
};

Underline.type = {
  id: "underline",
  parent: "annotation",
  properties: {}
};

Underline.Prototype = function() {};
Underline.Prototype.prototype = Annotation.prototype;
Underline.prototype = new Underline.Prototype();
Underline.prototype.constructor = Underline;

Underline.fragmentation = Annotation.DONT_CARE;

module.exports = Underline;
