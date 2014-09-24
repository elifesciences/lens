var _ = require('underscore');
var Document = require("substance-document");
var Surface = require("substance-surface");
var TOC = require("substance-toc");

function PanelFactory(panelSpecs) {
  this.panelSpecs = {};
  _.each(panelSpecs, function(spec, name) {
    this.addPanel(name, spec);
  }, this);
}

PanelFactory.Prototype = function() {

  var shouldBeVisible = function(name, doc) {
    var container = doc.get(name);
    return (!!container && container.nodes.length !== 0);
  };

  this.addPanel = function(name, panelSpec) {
    panelSpec.name = name;
    panelSpec.shouldBeVisible = panelSpec.shouldBeVisible || shouldBeVisible;
    this.panelSpecs[panelSpec.name] = panelSpec;
  };

  this.getSpec = function(name) {
    return this.panelSpecs[name];
  };

  this.getNames = function() {
    return Object.keys(this.panelSpecs);
  };

  this.createPanelController = function(doc, name) {
    return new Document.Controller( doc, {view: name} );
  };

  this.createPanelView = function(name, docCtrl) {
    var renderer, panelView;
    var spec = this.getSpec(name);
    var doc = docCtrl.__document;
    if (name === 'toc') {
      panelView = new TOC(doc);
    } else {
      if (spec.createRenderer) {
        renderer = spec.createRenderer(name, docCtrl);
      } else {
        var DefaultRenderer = doc.constructor.Renderer;
        renderer = new DefaultRenderer(docCtrl);
      }
      panelView = new Surface(docCtrl, {
        editable: false,
        renderer: renderer
      });
    }
    panelView.$el.addClass('resource-view');
    return panelView;
  };

};
PanelFactory.prototype = new PanelFactory.Prototype();

module.exports = PanelFactory;
