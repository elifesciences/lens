"use strict";

var AnnotationView = require('../annotation/annotation_view');

var ResourceReferenceView = function(node, viewFactory) {
  AnnotationView.call(this, node, viewFactory);
  this.$el.addClass('resource-reference');
};

ResourceReferenceView.Prototype = function() {
  this.createElement = function() {
    var el = document.createElement('a');
    el.setAttribute('href', '');
    return el;
  };
};
ResourceReferenceView.Prototype.prototype = AnnotationView.prototype;
ResourceReferenceView.prototype = new ResourceReferenceView.Prototype();

module.exports = ResourceReferenceView;
