"use strict";

var NodeView = require('../node').View;

// FormulaView
// ===========

var FormulaView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

FormulaView.Prototype = function() {

  var _types = {
    "latex": "math/tex",
    "mathml": "math/mml"
  };

  var _precedence = {
    "image": 0,
    "mathml": 1,
    "latex": 2
  };

  // Render the formula
  // --------

  this.render = function() {
    if (this.node.inline) {
      this.$el.addClass('inline');
    }

    var inputs = [], i;
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
      for (i=0; i<inputs.length; i++) {
        var format = inputs[i].format;
        var data = inputs[i].data;
        switch (format) {
          // HACK: ATM, in certain cases there are MJ issues
          // until then we just put the mml into root, and do not render the preview
          case "mathml":
            if (!hasSource) {
              this.$el.append($(data));
              hasSource = true;
              // prevent preview for the time being (HACK), as otherwise there will be two presentations
              if (hasPreview) {
                this.$preview.hide();
                hasPreview = true;
              }
            }
            break;
          case "latex":
            if (!hasSource) {
              var type = _types[format];
              if (!this.node.inline) type += "; mode=display";
              var $scriptEl = $('<script>')
                .attr('type', type)
                .html(data);
              this.$el.append($scriptEl);
              hasSource = true;
            }
            break;
          case "image":
            if (!hasPreview) {
              var $preview = $('<div>').addClass('MathJax_Preview');
              $preview.append($('<img>').attr('src', data));
              this.$el.append($preview);
              this.$preview = $preview;
              hasPreview = true;
            }
            break;
          default:
            console.error("Unknown formula format:", format);
        }
      }
    }
    // Add label to block formula
    // --------
    if (this.node.label) {
      this.$el.append($('<div class="label">').html(this.node.label));
    }
    return this;
  };
};

FormulaView.Prototype.prototype = NodeView.prototype;
FormulaView.prototype = new FormulaView.Prototype();

module.exports = FormulaView;
