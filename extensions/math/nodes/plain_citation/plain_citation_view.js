"use strict";

var LABELS = {
  "amsrefs": "AMSRefs",
  "bibtex": "BibTeX"
};

var _ = require('underscore');
var LensArticle = require('lens/article');
var LensNodes = require('lens/article/nodes');
var NodeView = LensNodes['node'].View;
var ResourceView = LensArticle.ResourceView;
var $$ = require("lens/substance/application").$$;

// Lens.Citation.View
// ==========================================================================

var PlainCitationView = function(node, viewFactory, options) {
  NodeView.apply(this, arguments);

  // Mix-in
  ResourceView.call(this, options);
};

PlainCitationView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    var frag = document.createDocumentFragment();
    var node = this.node;

    var contentView = this.createTextPropertyView([node.id, 'content'], { classes: 'content', elementType: 'span' });
    frag.appendChild(contentView.render().el);

    var rawFormatsEl = $$('.raw-formats', {html: ""});
    frag.appendChild(rawFormatsEl);

    _.each(node.raw_formats, function(rawFormat) {
      var type = rawFormat.type;
      var formatEl = $$('a.raw-format.'+type, {
        href: "data:text/plain;charset=UTF-8,"+encodeURIComponent(this.node.getRawFormatForType(type)),
        target: "_blank",
        "data-type": type,
        html: '<i class="fa fa-file-text-o"></i> '+LABELS[type]
      });
      rawFormatsEl.appendChild(formatEl);
    }, this);

    this.content.appendChild(frag);
  };

  this.getHeader = function() {
    return this.node.label;
  };

};

PlainCitationView.Prototype.prototype = NodeView.prototype;
PlainCitationView.prototype = new PlainCitationView.Prototype();
PlainCitationView.prototype.constructor = PlainCitationView;

module.exports = PlainCitationView;
