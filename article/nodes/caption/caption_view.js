"use strict";

var CompositeView = require("../composite").View;
var $$ = require("substance-application").$$;

// Lens.Caption.View
// ==========================================================================

var CaptionView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

CaptionView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.content = $$('div.content');

    // Add title paragraph
    var titleNode = this.node.getTitle();
    if (titleNode) {
      var titleView = this.createChildView(this.node.title);
      var titleEl = titleView.render().el;
      titleEl.classList.add('caption-title');
      this.content.appendChild(titleEl);
    }

    this.renderChildren();

    this.el.appendChild(this.content);
    return this;
  };

};

CaptionView.Prototype.prototype = CompositeView.prototype;
CaptionView.prototype = new CaptionView.Prototype();

module.exports = CaptionView;
