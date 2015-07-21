
var Annotation = require('../annotation/annotation');

var Code = function(node, doc) {
  Annotation.call(this, node, doc);
};

Code.type = {
  id: "underline",
  parent: "annotation",
  properties: {}
};

Code.Prototype = function() {};
Code.Prototype.prototype = Annotation.prototype;
Code.prototype = new Code.Prototype();
Code.prototype.constructor = Code;

Code.fragmentation = Annotation.DONT_CARE;

module.exports = Code;
