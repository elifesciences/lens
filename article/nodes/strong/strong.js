
var Annotation = require('../annotation/annotation');

var Strong = function(node, doc) {
  Annotation.call(this, node, doc);
};

Strong.type = {
  id: "strong",
  parent: "annotation",
  properties: {}
};

Strong.Prototype = function() {};
Strong.Prototype.prototype = Annotation.prototype;
Strong.prototype = new Strong.Prototype();
Strong.prototype.constructor = Strong;

Strong.fragmentation = Annotation.DONT_CARE;

module.exports = Strong;
