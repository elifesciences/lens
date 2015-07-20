var AnnotationView = require('../annotation').View;

var CustomAnnotationView = function(node) {
  AnnotationView.call(this, node);
};

CustomAnnotationView.Prototype = function() {

  this.setClasses = function() {
    AnnotationView.prototype.setClasses.call(this);
    this.$el.addClass(this.node.name);
  };

};
CustomAnnotationView.Prototype.prototype = AnnotationView.prototype;
CustomAnnotationView.prototype = new CustomAnnotationView.Prototype();

module.exports = CustomAnnotationView;
