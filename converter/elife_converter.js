"use strict";

var util = require("../substance/util");
var _ = require("underscore");

var LensConverter = require('./lens_converter');

var ElifeConverter = function(options) {
  LensConverter.call(this, options);
};

ElifeConverter.Prototype = function() {

  var __super__ = LensConverter.prototype;

  this.test = function(xmlDoc, documentUrl) {
		var publisherName = xmlDoc.querySelector("publisher-name").textContent;
    return publisherName === "eLife Sciences Publications, Ltd";
  };

  // Config
  // ---------
  //
  // This makes sure elife-xml-version does not show up in the info panel, as it's a custom metagroup that
  // would otherwise be considered by the converter

  this.__ignoreCustomMetaNames = ["elife-xml-version"];

  // Add Decision letter and author response
  // ---------

  this.enhanceArticle = function(state, article) {
    var nodes = [];
    var doc = state.doc;
    var heading, body;

    // Decision letter (if available)
    // -----------

    var articleCommentary = article.querySelector("#SA1");
    if (articleCommentary) {
      heading = {
        id: state.nextId("heading"),
        type: "heading",
        level: 1,
        content: "Decision letter"
      };
      doc.create(heading);
      nodes.push(heading);

      body = articleCommentary.querySelector("body");
      nodes = nodes.concat(this.bodyNodes(state, util.dom.getChildren(body)));
    }

    // Author response
    // -----------

    var authorResponse = article.querySelector("#SA2");
    if (authorResponse) {

      heading = {
        id: state.nextId("heading"),
        type: "heading",
        level: 1,
        content: "Author response"
      };
      doc.create(heading);
      nodes.push(heading);

      body = authorResponse.querySelector("body");
      nodes = nodes.concat(this.bodyNodes(state, util.dom.getChildren(body)));
    }

    // Show them off
    // ----------

    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  // Resolves figure url
  // --------
  //

  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");
    node.url = this.resolveURL(state, url);
  };


  // Example url to JPG: https://cdn.elifesciences.org/elife-articles/00768/svg/elife00768f001.jpg
  this.resolveURL = function(state, url) {
    // Use absolute URL
    if (url.match(/http:\/\//)) return url;

    // Look up base url
    var baseURL = this.getBaseURL(state);

    if (baseURL) {
      return [baseURL, url].join('');
    } else {
      // Use special URL resolving for production articles

      // File extension support
      if (url.match(/\.tif$/g)) {
        url = url.replace(/\.tif$/g, '.jpg')
      } else if (!(url.match(/\.gif$/g))) {
        url = url+'.jpg'
      }

      return [
        "https://cdn.elifesciences.org/articles/",
        state.doc.id,
        "/",
        url
      ].join('');
    }
  };

  this.enhanceSupplement = function(state, node) {
    var baseURL = this.getBaseURL(state);
    if (baseURL) {
      return [baseURL, node.url].join('');
    } else {
      node.url = [
        "https://cdn.elifesciences.org/articles/",
        state.doc.id,
        "/",
        node.url
      ].join('');
    }
  };

  this.enhancePublicationInfo = function(state) {
    var article = state.xmlDoc.querySelector("article");
    var articleMeta = article.querySelector("article-meta");

    var publicationInfo = state.doc.get('publication_info');

    // Extract research organism
    // ------------
    //

    // <kwd-group kwd-group-type="research-organism">
    // <title>Research organism</title>
    // <kwd>B. subtilis</kwd>
    // <kwd>D. melanogaster</kwd>
    // <kwd>E. coli</kwd>
    // <kwd>Mouse</kwd>
    // </kwd-group>
    var organisms = articleMeta.querySelectorAll("kwd-group[kwd-group-type=research-organism] kwd");

    // Extract keywords
    // ------------
    //
    // <kwd-group kwd-group-type="author-keywords">
    //  <title>Author keywords</title>
    //  <kwd>innate immunity</kwd>
    //  <kwd>histones</kwd>
    //  <kwd>lipid droplet</kwd>
    //  <kwd>anti-bacterial</kwd>
    // </kwd-group>
    var keyWords = articleMeta.querySelectorAll("kwd-group[kwd-group-type=author-keywords] kwd");

    // Extract subjects
    // ------------
    //
    // <subj-group subj-group-type="heading">
    // <subject>Immunology</subject>
    // </subj-group>
    // <subj-group subj-group-type="heading">
    // <subject>Microbiology and infectious disease</subject>
    // </subj-group>

    var subjects = articleMeta.querySelectorAll("subj-group[subj-group-type=heading] subject");

    // Article Type
    //
    // <subj-group subj-group-type="display-channel">
    //   <subject>Research article</subject>
    // </subj-group>

    var articleType = articleMeta.querySelector("subj-group[subj-group-type=display-channel] subject");

    // Extract PDF link
    // ---------------
    //
    // <self-uri content-type="pdf" xlink:href="elife00007.pdf"/>

    var pdfURI = article.querySelector("self-uri[content-type=pdf]");

    if (pdfURI) {
      var pdfLink = [
        "https://cdn.elifesciences.org/articles/",
        state.doc.id,
        "/",
        pdfURI ? pdfURI.getAttribute("xlink:href") : "#"
      ].join('');
    }

    // Version number from the PDF href, default to 1
    var match = null;
    if (pdfURI) {
      match = pdfURI.getAttribute("xlink:href").match(/\w*-\w*-v(\d*).pdf$/);
    }
    var version = match ? match[1] : 1;

    // Collect Links
    // ---------------

    var links = [];

    if (pdfLink) {
      links.push({
        url: pdfLink,
        name: "PDF",
        type: "pdf"
      });
    }

    links.push({
      url: "https://cdn.elifesciences.org/articles/"+state.doc.id+"/elife-"+state.doc.id+"-v"+version+".xml",
      name: "Source XML",
      type: "xml"
    });

    // Add JSON Link

    links.push({
      url: "", // will be auto generated
      name: "Lens JSON",
      type: "json"
    });

    publicationInfo.research_organisms = _.pluck(organisms, "textContent");
    publicationInfo.keywords = _.pluck(keyWords, "textContent");
    publicationInfo.subjects = _.pluck(subjects, "textContent");
    publicationInfo.article_type = articleType ? articleType.textContent : "";
    publicationInfo.links = links;

    publicationInfo.subject_link = 'https://elifesciences.org/category'
    publicationInfo.article_type_link = 'https://elifesciences.org/category'

    if (publicationInfo.related_article) publicationInfo.related_article = "http://dx.doi.org/" + publicationInfo.related_article;
  };

  this.enhanceSupplement = function(state, node) {
    var baseURL = this.getBaseURL(state);
    if (baseURL) {
      return [baseURL, node.url].join('');
    } else {
      node.url = [
        "https://cdn.elifesciences.org/articles/",
        state.doc.id,
        "/",
        node.url
      ].join('');
    }
  };

  this.enhanceVideo = function(state, node, element) {
    var href = element.getAttribute("xlink:href").split(".");
    var name = href[0];
    node.url = "https://master.api.elifesciences.org/v2/articles/"+state.doc.id+"/media/file/"+name+".mp4";
    node.url_ogv = "https://master.api.elifesciences.org/v2/articles/"+state.doc.id+"/media/file//"+name+".ogv";
    node.url_webm = "https://master.api.elifesciences.org/v2/articles/"+state.doc.id+"/media/file//"+name+".webm";
    node.poster = "https://master.api.elifesciences.org/v2/articles/"+state.doc.id+"/media/file/"+name+".jpg";
  };

  // Example url to JPG: https://cdn.elifesciences.org/elife-articles/00768/svg/elife00768f001.jpg
  this.resolveURL = function(state, url) {
    // Use absolute URL
    if (url.match(/http:\/\//)) return url;

    // Look up base url
    var baseURL = this.getBaseURL(state);

    if (baseURL) {
      return [baseURL, url].join('');
    } else {
      // Use special URL resolving for production articles

      // File extension support
      if (url.match(/\.tif$/g)) {
        url = url.replace(/\.tif$/g, '.jpg')
      } else if (!(url.match(/\.gif$/g))) {
        url = url+'.jpg'
      }

      return [
        "https://cdn.elifesciences.org/articles/",
        state.doc.id,
        "/",
        url
      ].join('');
    }
  };

  var AUTHOR_CALLOUT = /author-callout-style/;
  this.enhanceAnnotationData = function(state, anno, element, type) {
    // HACK: elife specific hack: there are 'styling' annotations to annotate
    // text in a certain color associated to one author.
    if (type === "named-content") {
      var contentType = element.getAttribute("content-type");
      if (AUTHOR_CALLOUT.test(contentType)) {
        anno.type = "author_callout";
        anno.style = contentType;
      }
    }
  };

  this.back = function(state, back) {
    var appGroups = back.querySelectorAll('app-group');

    if (appGroups && appGroups.length > 0) {
      _.each(appGroups, function(appGroup) {
        this.appGroup(state, appGroup);
      }.bind(this));
    }
  };

  this.showNode = function(state, node) {
    switch(node.type) {
    // Boxes go into the figures view if these conditions are met
    // 1. box has a label (e.g. elife 00288)
    case "box":
      if (node.label) {
        state.doc.show("figures", node.id);
      }
      break;
    default:
      __super__.showNode.apply(this, arguments);
    }
  };

};

ElifeConverter.Prototype.prototype = LensConverter.prototype;
ElifeConverter.prototype = new ElifeConverter.Prototype();
ElifeConverter.prototype.constructor = ElifeConverter;

module.exports = ElifeConverter;
