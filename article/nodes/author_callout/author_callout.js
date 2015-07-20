
var Document = require('substance-document');
var Annotation = require('../annotation/annotation');

var AuthorCallout = function(node, doc) {
  Annotation.call(this, node, doc);
};

AuthorCallout.type = {
  id: "emphasis",
  parent: "annotation",
  properties: {
    "style": "string"
  }
};

AuthorCallout.Prototype = function() {};
AuthorCallout.Prototype.prototype = Annotation.prototype;
AuthorCallout.prototype = new AuthorCallout.Prototype();
AuthorCallout.prototype.constructor = AuthorCallout;

AuthorCallout.fragmentation = Annotation.DONT_CARE;

Document.Node.defineProperties(AuthorCallout);

module.exports = AuthorCallout;
