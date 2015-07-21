"use strict";

module.exports = {
  /* basic/abstract node types */
  "node": require("./node"),
  "composite": require("./composite"),
  "annotation": require("./annotation"),
  /* Annotation types */
  "emphasis": require("./emphasis"),
  "strong": require("./strong"),
  "subscript": require("./subscript"),
  "superscript": require("./superscript"),
  "underline": require("./underline"),
  "code": require("./code"),
  "author_callout": require("./author_callout"),
  "custom_annotation": require("./custom_annotation"),
  "inline-formula": require("./inline_formula"),
  /* Reference types */
  "resource_reference": require("./resource_reference"),
  "contributor_reference": require("./contributor_reference"),
  "figure_reference": require("./figure_reference"),
  "citation_reference": require("./citation_reference"),
  "definition_reference": require("./definition_reference"),
  "cross_reference": require("./cross_reference"),
  "publication_info": require("./publication_info"),
  /* Annotation'ish content types */
  "link": require("./link"),
  "inline_image": require("./inline_image"),
  /* Content types */
  "document": require("./document"),
  "text": require("./text"),
  "paragraph": require("./paragraph"),
  "heading": require("./heading"),
  "box": require("./box"),
  "cover": require("./cover"),
  "figure": require("./figure"),
  "caption": require("./caption"),
  "image": require("./image"),
  "webresource": require("./web_resource"),
  "html_table": require("./html_table"),
  "supplement": require("./supplement"),
  "video": require("./video"),
  "contributor": require("./contributor"),
  "definition": require("./definition"),
  "citation": require("./citation"),
  "formula": require('./formula'),
  "list": require("./list"),
  "codeblock": require("./codeblock"),
  "affiliation": require("./_affiliation"),
  "footnote": require("./footnote")
};
