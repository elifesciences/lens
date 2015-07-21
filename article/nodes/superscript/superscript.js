
var Annotation = require('../annotation/annotation');

var Superscript = function(node, doc) {
  Annotation.call(this, node, doc);
};

Superscript.type = {
  id: "superscript",
  parent: "annotation",
  properties: {}
};

Superscript.Prototype = function() {};
Superscript.Prototype.prototype = Annotation.prototype;
Superscript.prototype = new Superscript.Prototype();
Superscript.prototype.constructor = Superscript;

Superscript.fragmentation = Annotation.DONT_CARE;

module.exports = Superscript;
