"use strict";

var AnnotationView = function(node, viewFactory) {
  this.node = node;
  this.viewFactory = viewFactory;
  this.el = this.createElement();
  this.el.dataset.id = node.id;
  this.$el = $(this.el);
  this.setClasses();
};

AnnotationView.Prototype = function() {

  this.createElement = function() {
    return document.createElement('span');
  };

  this.setClasses = function() {
    this.$el.addClass('annotation').addClass(this.node.type);
  };

  this.render = function() {
    return this;
  };

};
AnnotationView.prototype = new AnnotationView.Prototype();

module.exports = AnnotationView;
