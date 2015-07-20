"use strict";

var util = require("substance-util");
var Fragmenter = util.Fragmenter;
var View = require("substance-application").View;

// Substance.TextPropertyView
// -----------------
//

var TextPropertyView = function(doc, path, viewFactory, options) {
  options = options || {};
  options.elementType = options.elementType || 'span';
  View.call(this, options);

  this.path = path;
  this.document = doc;
  this.viewFactory = viewFactory;
  this.options = options || {};

  this.property = doc.resolve(this.path);
  this.$el.addClass('text');
  if (this.options.classes) {
    this.$el.addClass(this.options.classes);
  }
};

TextPropertyView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.el.innerHTML = "";
    TextPropertyView.renderAnnotatedText(this.document, this.property, this.el, this.viewFactory);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };

  this.renderWithAnnotations = function(annotations) {
    var that = this;
    var text = this.property.get();
    var fragment = document.createDocumentFragment();
    var doc = this.document;

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
    this.el.innerHTML = "";
    this.el.appendChild(fragment);
  };
};

TextPropertyView.Prototype.prototype = View.prototype;
TextPropertyView.prototype = new TextPropertyView.Prototype();

TextPropertyView.renderAnnotatedText = function(doc, property, el, viewFactory) {
  var fragment = window.document.createDocumentFragment();
  var text = property.get();
  var annotations = doc.getIndex("annotations").get(property.path);
  // this splits the text and annotations into smaller pieces
  // which is necessary to generate proper HTML.
  var annotationViews = [];
  var fragmenter = new Fragmenter();
  fragmenter.onText = function(context, text) {
    context.appendChild(window.document.createTextNode(text));
  };
  fragmenter.onEnter = function(entry, parentContext) {
    var anno = doc.get(entry.id);
    var annotationView = viewFactory.createView(anno);
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
  el.appendChild(fragment);
};

module.exports = TextPropertyView;