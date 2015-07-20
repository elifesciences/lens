
var Document = require('substance-document');

// Formula
// -----------------
//

var Formula = function(node) {
  Document.Node.call(this, node);
};

// Type definition
// -----------------
//

Formula.type = {
  "id": "formula",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "inline": "boolean",
    // a reference label as typically used in display formulas
    "label": "string",
    // we support multiple representations of the formula
    "format": ["array", "string"],
    "data": ["array", "string"],
  }
};


// This is used for the auto-generated docs
// -----------------
//

Formula.description = {
  "name": "Formula",
  "remarks": [
    "Can either be expressed in MathML format or using an image url"
  ],
  "properties": {
    "label": "Formula label (4)",
    "data": "Formula data, either MathML or image url",
    "format": "Can either be `mathml` or `image`"
  }
};


// Example Formula
// -----------------
//

Formula.example = {
  "type": "formula",
  "id": "formula_eqn1",
  "label": "(1)",
  "content": "<mml:mrow>...</mml:mrow>",
  "format": "mathml"
};

Formula.Prototype = function() {
  this.inline = false;
};

Formula.Prototype.prototype = Document.Node.prototype;
Formula.prototype = new Formula.Prototype();
Formula.prototype.constuctor = Formula;

Document.Node.defineProperties(Formula);

module.exports = Formula;
