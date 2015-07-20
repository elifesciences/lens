"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;
var ResourceView = require('../../resource_view');

// Substance.Paragraph.View
// ==========================================================================

var HTMLTableView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

HTMLTableView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  this.renderBody = function() {

    // The actual content
    // --------
    //

    var tableWrapper = $$('.table-wrapper', {
      html: this.node.content // HTML table content
    });

    this.content.appendChild(tableWrapper);

    // Display footers (optional)
    // --------
    //

    var footers = $$('.footers', {
      children: _.map(this.node.footers, function(footer) {
        return $$('.footer', { html: "<b>"+footer.label+"</b> " + footer.content });
      })
    });

    // Display caption


    if (this.node.caption) {
      var captionView = this.createView(this.node.caption);
      this.content.appendChild(captionView.render().el);
    }

    this.content.appendChild(footers);
  };

};

HTMLTableView.Prototype.prototype = NodeView.prototype;
HTMLTableView.prototype = new HTMLTableView.Prototype();

module.exports = HTMLTableView;
