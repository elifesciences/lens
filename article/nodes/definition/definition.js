
var Document = require('substance-document');

// Lens.Definition
// -----------------
//

var Definition = function(node) {
  Document.Node.call(this, node);
};

// Type definition
// -----------------
//

Definition.type = {
  "id": "definition", // type name
  "parent": "content",
  "properties": {
    "source_id": "string",
    "title": "string",
    "description": "string"
  }
};

// This is used for the auto-generated docs
// -----------------
//

Definition.description = {
  "name": "Definition",
  "remarks": [
    "A journal citation.",
    "This element can be used to describe all kinds of citations."
  ],
  "properties": {
    "title": "The article's title",
    "description": "Definition description",
  }
};


// Example Definition
// -----------------
//

Definition.example = {
  "id": "definition_def1",
  "type": "Definition",
  "title": "IAP",
  "description": "Integrated Analysis Platform",
};


Definition.Prototype = function() {
  // Returns the citation URLs if available
  // Falls back to the DOI url
  // Always returns an array;
  this.urls = function() {
    return this.properties.citation_urls.length > 0 ? this.properties.citation_urls
                                                    : [this.properties.doi];
  };

  this.getHeader = function() {
    if (this.properties.label) {
      return [this.properties.label,this.properties.title].join(". ");
    }
    else {
      return this.properties.title;
    }
  };

};

Definition.Prototype.prototype = Document.Node.prototype;
Definition.prototype = new Definition.Prototype();
Definition.prototype.constructor = Definition;

Document.Node.defineProperties(Definition);

module.exports = Definition;
