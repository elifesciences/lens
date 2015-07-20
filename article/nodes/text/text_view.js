"use strict";

var util = require("substance-util");
var Fragmenter = util.Fragmenter;
var NodeView = require('../node/node_view');
var $$ = require("substance-application").$$;

// Substance.Text.View
// -----------------
//

var TextView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  options = this.options = options || {};
  this.path = options.path || [ node.id, 'content' ];
  this.property = node.document.resolve(this.path);

  this.$el.addClass('text');

  if (options.classes) {
    this.$el.addClass(options.classes);
  }

  // TODO: it would be better to implement the rendering in a TextPropertyView and
  // make this view a real node view only
  // remove the 'content-node' class if this is used as a property view
  if (options.path) {
    this.$el.removeClass('content-node');
  }

  this._annotations = {};
};

TextView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    NodeView.prototype.render.call(this);
    this.renderContent();
    return this;
  };

  this.dispose = function() {
    NodeView.prototype.dispose.call(this);
  };

  this.renderContent = function() {
    this.content.innerHTML = "";
    this._annotations = this.node.document.getIndex("annotations").get(this.path);
    this.renderWithAnnotations(this._annotations);
  };

  this.createAnnotationElement = function(entry) {
    if (this.options.createAnnotationElement) {
      return this.options.createAnnotationElement.call(this, entry);
    } else {
      var el;
      if (entry.type === "link") {
        el = $$('a.annotation.'+entry.type, {
          id: entry.id,
          href: this.node.document.get(entry.id).url // "http://zive.at"
        });
      } else {
        el = $$('span.annotation.'+entry.type, {
          id: entry.id
        });
      }
      return el;
    }
  };

  this.renderWithAnnotations = function(annotations) {
    var that = this;
    var text = this.property.get();
    var fragment = document.createDocumentFragment();
    var doc = this.node.document;

    var annotationViews = [];

    // this splits the text and annotations into smaller pieces
    // which is necessary to generate proper HTML.
    var fragmenter = new Fragmenter();
    fragmenter.onText = function(context, text) {
      context.appendChild(document.createTextNode(text));
    };
    fragmenter.onEnter = function(entry, parentContext) {
      var anno = doc.get(entry.id);
      var annotationView = that.viewFactory.createView(anno);
      parentContext.appendChild(annotationView.el);
      annotationViews.push(annotationView);
      return annotationView.el;
    };
    // this calls onText and onEnter in turns...
    fragmenter.start(fragment, text, annotations);

    // allow all annotationViews to (re-)render to allow annotations with custom
    // rendering (e.g., inline-formulas)
    for (var i = 0; i < annotationViews.length; i++) {
      annotationViews[i].render();
    }

    // set the content
    this.content.innerHTML = "";
    this.content.appendChild(fragment);
  };
};

TextView.Prototype.prototype = NodeView.prototype;
TextView.prototype = new TextView.Prototype();

module.exports = TextView;
