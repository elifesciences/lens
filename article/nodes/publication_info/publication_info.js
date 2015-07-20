"use strict";

var Document = require("substance-document");

var PublicationInfo = function(node, doc) {
  Document.Node.call(this, node, doc);
};

PublicationInfo.type = {
  "id": "publication_info",
  "parent": "content",
  "properties": {
    // history: array of { type: 'string', date: 'string'}
    "history": [ "array", "object" ],
    "published_on": "string",
    "journal": "string",
    "provider": "string",
    "article_type": "string",
    "keywords": ["array", "string"],
    "research_organisms": ["array", "string"],
    "subjects": ["array", "string"],
    "links": ["array", "objects"],
    "doi": "string",
    "related_article": "string",
    "article_info": "paragraph"
  }
};


PublicationInfo.description = {
  "name": "PublicationInfo",
  "description": "PublicationInfo Node",
  "remarks": [
    "Summarizes the article's meta information. Meant to be customized by publishers"
  ],
  "properties": {
    "received_on": "Submission received",
    "accepted_on": "Paper accepted on",
    "published_on": "Paper published on",
    "history": "History of the submission cycle",
    "journal": "The Journal",
    "provider": "Who is hosting this article",
    "article_type": "Research Article vs. Insight, vs. Correction etc.",
    "keywords": "Article's keywords",
    "research_organisms": "Research Organisms",
    "subjects": "Article Subjects",
    "doi": "Article DOI",
    "related_article": "DOI of related article if there is any"
  }
};


PublicationInfo.example = {
  "id": "publication_info",
  "published_on": "2012-11-13",
  "history": [
    { "type": "received", "date": "2012-06-20" },
    { "type": "accepted", "date": "2012-09-05" }
  ],
  "journal": "eLife",
  "provider": "eLife",
  "article_type": "Research Article",
  "keywords": [
    "innate immunity",
    "histones",
    "lipid droplet",
    "anti-bacterial"
  ],
  "research_organisms": [
    "B. subtilis",
    "D. melanogaster",
    "E. coli",
    "Mouse"
  ],
  "subjects": [
    "Immunology",
    "Microbiology and infectious disease"
  ],
  "doi": "http://dx.doi.org/10.7554/eLife.00003"
};


PublicationInfo.Prototype = function() {

  this.getArticleInfo = function() {
    return this.document.get("articleinfo");
  };

};

PublicationInfo.Prototype.prototype = Document.Node.prototype;
PublicationInfo.prototype = new PublicationInfo.Prototype();
PublicationInfo.prototype.constructor = PublicationInfo;

Document.Node.defineProperties(PublicationInfo);

module.exports = PublicationInfo;
