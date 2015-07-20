"use strict";

var View = require("substance-application").View;
var TextPropertyView = require("../text/text_property_view");

// Substance.Node.View
// -----------------

var NodeView = function(node, viewFactory, options) {
  View.call(this, options);
  this.node = node;
  this.viewFactory = viewFactory;
  if (!viewFactory) {
    throw new Error('Illegal argument. Argument "viewFactory" is mandatory.');
  }
  this.$el.addClass('content-node').addClass(node.type.replace('_', '-'));
  this.el.dataset.id = this.node.id;
};

NodeView.Prototype = function() {

  // Rendering
  // --------
  //

  this.render = function() {
    this.content = document.createElement("DIV");
    this.content.classList.add("content");

    this.focusHandle = document.createElement("DIV");
    this.focusHandle.classList.add('focus-handle');

    this.el.appendChild(this.content);
    this.el.appendChild(this.focusHandle);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };

  this.createView = function(nodeId) {
    var childNode = this.node.document.get(nodeId);
    var view = this.viewFactory.createView(childNode);
    return view;
  };


  this.createTextView = function(options) {
    console.error('FIXME: NodeView.createTextView() is deprecated. Use NodeView.createTextPropertyView() instead.');
    var view = this.viewFactory.createView(this.node, options, 'text');
    return view;
  };

  this.createTextPropertyView = function(path, options) {
    var view = new TextPropertyView(this.node.document, path, this.viewFactory, options);
    return view;
  };

  this.renderAnnotatedText = function(path, el) {
    var property = this.node.document.resolve(path);
    var view = TextPropertyView.renderAnnotatedText(this.node.document, property, el, this.viewFactory);
    return view;
  };

};

NodeView.Prototype.prototype = View.prototype;
NodeView.prototype = new NodeView.Prototype();

module.exports = NodeView;
