var _ = require('underscore');
var Application = require('../substance/application');
var View = Application.View;

// This class replaces substance-surface in a minimalistic way.
// Substance.Surfance primarily is made for editing, which is not used in lens currently.
// This stub implementation represents the minimal expected Surface interface for lens.
var LensSurface = function(docCtrl, options) {
  View.call(this, options);

  this.docCtrl = docCtrl;
  this.options = options;
  this.document = docCtrl.getDocument();

  if (this.options.viewFactory) {
    this.viewFactory = this.options.viewFactory;
  } else {
    this.viewFactory = new this.document.constructor.ViewFactory(this.document.nodeTypes);
  }

  this.$el.addClass('surface');

  this.$nodes = $('<div>').addClass("nodes");
  this.$el.append(this.$nodes);
};
LensSurface.Prototype = function() {

  this.render = function() {
    this.$nodes.html(this.build());
    return this;
  };

  this.findNodeView = function(nodeId) {
    return this.el.querySelector('*[data-id='+nodeId+']');
  };

  this.build = function() {
    var frag = document.createDocumentFragment();
    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });
    this.nodes = {};
    var docNodes = this.docCtrl.container.getTopLevelNodes();
    _.each(docNodes, function(n) {
      var view = this.renderNodeView(n);
      this.nodes[n.id] = view;
      frag.appendChild(view.el);
    }, this);
    return frag;
  };

  this.renderNodeView = function(n) {
    var view = this.viewFactory.createView(n, { topLevel: true });
    view.render();
    return view;
  };

};
LensSurface.Prototype.prototype = View.prototype;
LensSurface.prototype = new LensSurface.Prototype();
LensSurface.prototype.constructor = LensSurface;

module.exports = LensSurface;
