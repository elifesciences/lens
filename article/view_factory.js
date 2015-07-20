
var ViewFactory = function(nodeTypes, options) {
  this.nodeTypes = nodeTypes;
  this.options = options || {};
};

ViewFactory.Prototype = function() {

  this.getNodeViewClass = function(node, type) {
    type = type || node.type;
    var NodeType = this.nodeTypes[type];
    if (!NodeType) {
      throw new Error('No node registered for type ' + type + '.')
    }
    var NodeView = NodeType.View;
    if (!NodeView) {
      throw new Error('No view registered for type "'+node.type+'".');
    }
    return NodeView;
  };

  this.createView = function(node, options, type) {
    var NodeView = this.getNodeViewClass(node, type);
    // Note: passing the factory to the node views
    // to allow creation of nested views
    var nodeView = new NodeView(node, this, options);
    return nodeView;
  };

};

ViewFactory.prototype = new ViewFactory.Prototype();

module.exports = ViewFactory;
