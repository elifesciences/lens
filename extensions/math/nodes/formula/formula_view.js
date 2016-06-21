"use strict";

var _ = require('underscore');
var LensNodes = require('../../../../article/nodes');
var NodeView = LensNodes["node"].View;
var LensArticle = require('../../../../article');
var ResourceView = LensArticle.ResourceView;

var $$ = require('../../../../substance/application').$$;

// FormulaView
// ===========

var FormulaView = function(node, viewFactory, options) {
  options = options || {};
  options.elementType = node.inline ? 'span' : 'div';
  NodeView.call(this, node, viewFactory, options);

  // Mix-in
  ResourceView.call(this, options);

  if (this.node.inline) {
    this.content = document.createElement("span");
    this.$el.addClass('inline');
  } else {
    this.content = document.createElement("div");
  }

  this.$content = $(this.content);
  this.$content.addClass("content");

  if (!this.node.inline) {
    this.focusHandle = document.createElement("DIV");
    this.focusHandle.classList.add('focus-handle');
    this.el.appendChild(this.focusHandle);
  }

  this.$el.append(this.$content);
};

FormulaView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  var _types = {
    "latex": "math/tex",
    "mathml": "math/mml"
  };

  var _precedence = {
    "svg": 0,
    "image": 1,
    "mathml": 2,
    "latex": 3
  };

  // Render the formula
  // --------

  this.render = function() {
    // a header is rendered for display-formulas in the resource panel
    if (this.options.header && !this.node.inline) {
       this.renderHeader();
    }
    this.renderBody();
    return this;
  };

  // TODO: This is currently redundant with implementation in ResoureView
  // We need some cleanup here in general after the space-efficiency UI update.
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
    var inputs = [], i;
    var $content = $(this.content);

    // In the content panel, show a bracket for diplay-formulas which are displayed in math panel (i.e, have references to it or specific-use=panel)
    if (!this.options.header && !this.node.inline && (this.node.isReferenced || this.node.specificUse === 'resource')) {
      var $corners = $('<div>').addClass('corners');
      $content.append($corners);
    }

    for (i=0; i<this.node.data.length; i++) {
      inputs.push({
        format: this.node.format[i],
        data: this.node.data[i]
      });
    }
    inputs.sort(function(a, b) {
      return _precedence[a.format] - _precedence[b.format];
    });

    if (inputs.length > 0) {
      // TODO: we should allow to make it configurable
      // which math source format should be used in first place
      // For now, we take the first available format which is not image
      // and use the image to configure MathJax's preview.
      var hasPreview = false;
      var hasSource = false;

      // always add a preview element as this is better for MJ
      // ... and add it before the script element
      var $preview = $('<span>').addClass('MathJax_Preview');
      this.$content.append($preview);

      for (i=0; i<inputs.length; i++) {
        var format = inputs[i].format;
        var data = inputs[i].data;
        switch (format) {
          case "mathml":
          case "latex":
            // add only one source
            if (!hasSource) {
              var type = _types[format];
              if (!this.node.inline) type += "; mode=display";
              var scriptEl = document.createElement('script');
              scriptEl.setAttribute("type", type);
              scriptEl.textContent = data;
              this.content.appendChild(scriptEl);
              hasSource = true;
              // if there has been no other preview, just use the source as preview
              if (!hasPreview) {
                $preview.append(data);
                hasPreview = true;
              }
            }
            break;
          case "image":
            // add only one preview
            if (!hasPreview) {
              $preview.append($('<img>').attr('src', data));
              hasPreview = true;
            }
            break;
          case "svg":
            // add only one preview
            if (!hasPreview) {
              $preview.append($(data));
              hasPreview = true;
            }
            break;
            case "html":
              // add only if no preview
              if (!hasPreview) {
                // don't use a preview element
                this.$content.append($(data));
                hasPreview = true;
              }
              break;
          default:
            console.error("Unknown formula format:", format);
        }
      }
    }

    if (this.options.header) {
      var gotoMainOccurrence = $$('a.jump-to-resource', {
        href: '#',
        html: "<i class=\"icon-search\"></i> Show in context"
      });
      $content.append(gotoMainOccurrence);

      var numberRefsEl = $$('div.number-of-references');
      var numRefs = this.node.document.indexes.referenceByTarget.get(this.node.id).getLength();
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

  this.getHeader = function() {
    return this.node.label;
  };
};

FormulaView.Prototype.prototype = NodeView.prototype;
FormulaView.prototype = new FormulaView.Prototype();

module.exports = FormulaView;
