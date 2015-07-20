"use strict";

var _ = require('underscore');
var $$ = require("substance-application").$$;
var NodeView = require("../node").View;
var ResourceView = require('../../resource_view');

// Lens.Citation.View
// ==========================================================================


var CitationView = function(node, viewFactory, options) {
  NodeView.apply(this, arguments);

  // Mix-in
  ResourceView.call(this, options);

};


CitationView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    var frag = document.createDocumentFragment();
    var node = this.node;

    // Add title
    // -------

    var titleView = this.createTextPropertyView([node.id, 'title'], { classes: 'title' });
    frag.appendChild(titleView.render().el);

    // Add Authors
    // -------

    frag.appendChild($$('.authors', {
      html: node.authors.join(', ')
    }));

    // Add Source
    // -------

    var sourceText = "",
        sourceFrag = "",
        pagesFrag = "",
        publisherFrag = "";

    // Hack for handling unstructured citation types and render prettier
    if (node.source && node.volume === '') {
      sourceFrag = node.source;
    } else if (node.source && node.volume) {
      sourceFrag = [node.source, node.volume].join(', ');
    }

    if (node.fpage && node.lpage) {
      pagesFrag = [node.fpage, node.lpage].join('-');
    }

    // Publisher Frag

    var elems = [];

    if (node.publisher_name && node.publisher_location) {
      elems.push(node.publisher_name);
      elems.push(node.publisher_location);
    }

    if (node.year) {
      elems.push(node.year);
    }

    publisherFrag = elems.join(', ');

    // Put them together
    sourceText = sourceFrag;

    // Add separator only if there's content already, and more to display
    if (sourceFrag && (pagesFrag || publisherFrag)) {
      sourceText += ": ";
    }

    if (pagesFrag && publisherFrag) {
      sourceText += [pagesFrag, publisherFrag].join(", ");
    } else {
      // One of them without a separator char
      sourceText += pagesFrag;
      sourceText += publisherFrag;
    }

    frag.appendChild($$('.source', {
      html: sourceText
    }));

    if (node.comment) {
      var commentView = this.createTextView({ path: [node.id, 'comment'], classes: 'comment' });
      frag.appendChild(commentView.render().el);
    }

    // Add DOI (if available)
    // -------

    if (node.doi) {
      frag.appendChild($$('.doi', {
        children: [
          $$('b', {text: "DOI: "}),
          $$('a', {
            href: node.doi,
            target: "_new",
            text: node.doi
          })
        ]
      }));
    }

    // TODO: Add display citations urls
    // -------

    var citationUrlsEl = $$('.citation-urls');

    _.each(node.citation_urls, function(url) {
      citationUrlsEl.appendChild($$('a.url', {
        href: url.url,
        text: url.name,
        target: "_blank"
      }));
    });

    frag.appendChild(citationUrlsEl);

    this.content.appendChild(frag);
  };

};

CitationView.Prototype.prototype = NodeView.prototype;
CitationView.prototype = new CitationView.Prototype();
CitationView.prototype.constructor = CitationView;

module.exports = CitationView;
