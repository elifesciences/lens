"use strict";

var _ = require('underscore');
var CompositeView = require("../composite").View;
var $$ = require("substance-application").$$;
var ResourceView = require('../../resource_view');

// Lens.Supplement.View
// ==========================================================================

var SupplementView = function(node, viewFactory, options) {
  CompositeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

SupplementView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {

    this.renderChildren();

    var file = $$('div.file', {
      children: [
        $$('a', {href: this.node.url, html: '<i class="fa fa-download"/> Download' })
      ]
    });
    this.content.appendChild(file);
  };
};

SupplementView.Prototype.prototype = CompositeView.prototype;
SupplementView.prototype = new SupplementView.Prototype();
SupplementView.prototype.constructor = SupplementView;

module.exports = SupplementView;
