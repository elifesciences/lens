
var Annotation = require('../annotation/annotation');

var Emphasis = function(node, doc) {
  Annotation.call(this, node, doc);
};

Emphasis.type = {
  id: "emphasis",
  parent: "annotation",
  properties: {}
};

Emphasis.Prototype = function() {};
Emphasis.Prototype.prototype = Annotation.prototype;
Emphasis.prototype = new Emphasis.Prototype();
Emphasis.prototype.constructor = Emphasis;

Emphasis.fragmentation = Annotation.DONT_CARE;

module.exports = Emphasis;
