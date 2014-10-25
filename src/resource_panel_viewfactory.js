
var ViewFactory = require('lens-article').ViewFactory;

var DEFAULT_OPTIONS = {
  header: true,
  zoom: false
};

var ResourcePanelViewFactory = function(nodeTypes, options) {
  ViewFactory.call(this, nodeTypes);
  this.options = options || DEFAULT_OPTIONS;
};

ResourcePanelViewFactory.Prototype = function() {

  this.createView = function(node, options, type) {
    options = options || {};
    var NodeView = this.getNodeViewClass(node, type);
    if (NodeView.prototype.isResourceView && this.options.header) {
      options.header = true;
      if (NodeView.prototype.isZoomable && this.options.zoom) {
        options.zoom = true;
      }
    }
    // Note: passing the factory to the node views
    // to allow creation of nested views
    var nodeView = new NodeView(node, this, options);
    return nodeView;
  };

};
ResourcePanelViewFactory.Prototype.prototype = ViewFactory.prototype;
ResourcePanelViewFactory.prototype = new ResourcePanelViewFactory.Prototype();

module.exports = ResourcePanelViewFactory;
