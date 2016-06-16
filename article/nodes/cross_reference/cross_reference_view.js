"use strict";

var AnnotationView = require('../annotation/annotation_view');

var CrossReferenceView = function(node, viewFactory) {
  AnnotationView.call(this, node, viewFactory);
  this.$el.addClass('cross-reference');
};

CrossReferenceView.Prototype = function() {
  this.createElement = function() {
    var el = document.createElement('a');
    el.setAttribute('href', '');
    return el;
  };
};
CrossReferenceView.Prototype.prototype = AnnotationView.prototype;
CrossReferenceView.prototype = new CrossReferenceView.Prototype();

module.exports = CrossReferenceView;
