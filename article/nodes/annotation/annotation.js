
var Document = require('substance-document');

var Annotation = function(node, doc) {
  Document.Node.call(this, node, doc);
};

Annotation.type = {
  id: 'annotation',
  properties: {
    path: ["array", "string"], // -> e.g. ["text_1", "content"]
    range: ['array', 'number']
  }
};

Annotation.Prototype = function() {
  this.getLevel = function() {
    return this.constructor.fragmentation;
  };
};

Annotation.Prototype.prototype = Document.Node.prototype;
Annotation.prototype = new Annotation.Prototype();
Annotation.prototype.constructor = Annotation;

Annotation.NEVER = 1;
Annotation.OK = 2;
Annotation.DONT_CARE = 3;

// This is used to control fragmentation where annotations overlap.
Annotation.fragmentation = Annotation.DONT_CARE;

Document.Node.defineProperties(Annotation);

module.exports = Annotation;
