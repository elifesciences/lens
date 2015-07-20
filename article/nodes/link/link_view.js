var AnnotationView = require('../annotation').View;

var LinkView = function(node) {
  AnnotationView.call(this, node);
};

LinkView.Prototype = function() {

  this.createElement = function() {
    var el = document.createElement('a');
    el.setAttribute('href', this.node.url);
    return el;
  };

  this.setClasses = function() {
    this.$el.addClass('link');
  };

};
LinkView.Prototype.prototype = AnnotationView.prototype;
LinkView.prototype = new LinkView.Prototype();

module.exports = LinkView;
