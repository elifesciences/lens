"use strict";

var NodeView = require("../node").View;
var $$ = require("substance-application").$$;


// Substance.Heading.View
// ==========================================================================

var HeadingView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass('level-'+this.node.level);
};

HeadingView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Heading title
    var titleView = this.createTextPropertyView([this.node.id, 'content'], {
      classes: 'title'
    });

    if (this.node.label) {
      var labelEl = $$('.label', {text: this.node.label});
      this.content.appendChild(labelEl);
    }

    this.content.appendChild(titleView.render().el);
    return this;
  };

  this.renderTocItem = function() {
    var el = $$('div');
    if (this.node.label) {
      var labelEl = $$('.label', {text: this.node.label});
      el.appendChild(labelEl);
    }
    var titleEl = $$('span');
    this.renderAnnotatedText([this.node.id, 'content'], titleEl);
    el.appendChild(titleEl);
    return el;
  };

};

HeadingView.Prototype.prototype = NodeView.prototype;
HeadingView.prototype = new HeadingView.Prototype();

module.exports = HeadingView;
