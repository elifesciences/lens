"use strict";

var _ = require('underscore');
var LensArticle = require('lens/article');
var LensNodes = require('lens/article/nodes');
var NodeView = LensNodes["node"].View;
var ResourceView = LensArticle.ResourceView;

var $$ = require('lens/substance/application').$$;

// Lens.MathEnvironment.View
// ==========================================================================

var MathEnvironmentView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

    // Mix-in
  ResourceView.call(this, options);

  this.$header = null;
  this.$body = null;

  this.$el.addClass(node.envType);

  // var references = this.node.document.indexes.referenceByTarget.get(this.node.id);
  // if (references.getLength() === 0) {
  //   this.$el.addClass('unreferenced');
  // }
};

MathEnvironmentView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  this.renderHeader = function() {
    if (this.options.header) {
      var headerEl = $$('.resource-header');
      headerEl.appendChild(this.renderLabel());
      var togglesEl = $$('.toggles');
      togglesEl.appendChild($$('a.toggle.toggle-res.toggle-res.action-toggle-resource', {
        "href": "#",
        "html": "<i class=\"fa fa-eye\"></i> Focus"
      }));
      headerEl.appendChild(togglesEl);
      this.headerEl = headerEl;
      this.el.insertBefore(headerEl, this.content);
    }
  };

  this.renderBody = function() {
    var $content = $(this.content);
    var referenceIndex = this.node.document.getIndex('referenceByTarget');

    // In the content panel, show a bracket if the environment is displayed in math panel (i.e, have references to it or specific-use=panel)
    if (!this.options.header && !this.node.inline && (this.node.isReferenced || this.node.specificUse === 'resource')) {
      var $corners = $('<div>').addClass('corners');
      $content.append($corners);
    }

    // show a header in
    if (!this.options.header) {
      $content.append($(this.getHeader()));
    }

    var nodeIds = this.node.body;
    _.each(nodeIds, function(nodeId) {
      var childView = this.createView(nodeId);
      $content.append(childView.render().el);
    }, this);

    if (this.options.header) {
      var gotoMainOccurrence = $$('a.jump-to-resource', {
        href: '#',
        html: "<i class=\"icon-search\"></i> Show in context"
      });
      $content.append(gotoMainOccurrence);

      var numberRefsEl = $$('div.number-of-references');
      var numRefs = referenceIndex.get(this.node.id).getLength();
      if (numRefs === 0) {
        numberRefsEl.textContent = "No references";
      } else if (numRefs === 1) {
        numberRefsEl.textContent = "1 reference";
      } else {
        numberRefsEl.textContent = numRefs + " references";
      }
      $content.append(numberRefsEl);
    }

    return this;
  };

  // Note: this is called only when this view is used in a resource panel
  this.getHeader = function() {
    var $header = $('<div>');
    if (this.node.label) {
      var labelView = this.createTextPropertyView([this.node.id, 'label'], {
        classes: "env-label"
      });
      $header.append(labelView.render().el);
    }
    if (this.node.comment) {
      var commentView = this.createTextPropertyView([this.node.id, 'comment'], {
        classes: "comment"
      });
      $header.append(commentView.render().el);
    }
    return $header.html();
  };

  this.renderTocItem = function() {
    var el = $$('div');
    el.innerHTML = this.getHeader();
    return el;
  };
};

MathEnvironmentView.Prototype.prototype = NodeView.prototype;
MathEnvironmentView.prototype = new MathEnvironmentView.Prototype();

module.exports = MathEnvironmentView;
