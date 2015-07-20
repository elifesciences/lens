
var Annotation = require('../annotation/annotation');

var Subscript = function(node, doc) {
  Annotation.call(this, node, doc);
};

Subscript.type = {
  id: "subscript",
  parent: "annotation",
  properties: {}
};

Subscript.Prototype = function() {};
Subscript.Prototype.prototype = Annotation.prototype;
Subscript.prototype = new Subscript.Prototype();
Subscript.prototype.constructor = Subscript;

Subscript.fragmentation = Annotation.DONT_CARE;

module.exports = Subscript;
