var _ = require('underscore');
var Document = require('substance-document');

// Lens.Cover
// -----------------
//

var Cover = function(node, doc) {
  Document.Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Cover.type = {
  "id": "cover",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "authors": ["array", "paragraph"],
    "breadcrumbs": "object"
    // No properties as they are all derived from the document node
  }
};


// This is used for the auto-generated docs
// -----------------
//

Cover.description = {
  "name": "Cover",
  "remarks": [
    "Virtual view on the title and authors of the paper."
  ],
  "properties": {
    "authors": "A paragraph that has the authors names plus references to the person cards"
  }
};

// Example Cover
// -----------------
//

Cover.example = {
  "id": "cover",
  "type": "cover"
};

Cover.Prototype = function() {

  this.getAuthors = function() {
    return _.map(this.properties.authors, function(paragraphId) {
      return this.document.get(paragraphId);
    }, this);
  };

  this.getTitle = function() {
    return this.document.title;
  };

};

Cover.Prototype.prototype = Document.Node.prototype;
Cover.prototype = new Cover.Prototype();
Cover.prototype.constructor = Cover;

Document.Node.defineProperties(Cover);

module.exports = Cover;
