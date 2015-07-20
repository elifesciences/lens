var AnnotationView = require('../annotation').View;

var AuthorCalloutView = function(node) {
  AnnotationView.call(this, node);
};

AuthorCalloutView.Prototype = function() {

  this.setClasses = function() {
    AnnotationView.prototype.setClasses.call(this);
    this.$el.addClass(this.node.style);
  };

};
AuthorCalloutView.Prototype.prototype = AnnotationView.prototype;
AuthorCalloutView.prototype = new AuthorCalloutView.Prototype();

module.exports = AuthorCalloutView;
