var _ = require('underscore');
var Document = require("substance-document");
var Panel = require('./panel');
var ContainerPanelView = require('./container_panel_view');
var ContentPanelView = require('./content_panel_view');

function PanelFactory(panelSpecs) {
  this.panelSpecs = {
    panels: {},
    panelOrder: panelSpecs.panelOrder
  };
  _.each(panelSpecs.panels, function(spec, name) {
    this.addPanel(name, spec);
  }, this);
}

PanelFactory.Prototype = function() {

  this.addPanel = function(name, panelSpec) {
    panelSpec.name = name;
    this.panelSpecs.panels[panelSpec.name] = panelSpec;
  };

  this.getSpec = function(name) {
    return this.panelSpecs.panels[name];
  };

  this.getNames = function() {
    return this.panelSpecs.panelOrder;
  };

  this.createPanel = function(doc, name) {
    var spec = this.getSpec(name);
    var panelView, panelCtrl;
    var panel;

    // default container renderer
    if (spec.container) {
      var docCtrl = new Document.Controller( doc, { view: spec.container } );
      var renderer;
      // TODO: it doesn't feel good to need a DocumentCtrl for creating a renderer
      // probably, a Container instance would be enough. Actually, it is a ContainerRenderer not an ArticleRenderer.
      if (spec.createRenderer) {
        renderer = spec.createRenderer(docCtrl, spec.container);
      } else if (spec.renderer) {
        renderer = new spec.renderer(docCtrl);
      } else {
        var DefaultRenderer = doc.constructor.Renderer;
        renderer = new DefaultRenderer(docCtrl);
      }
      if (spec.container === "content") {
        panelView = new ContentPanelView(doc, docCtrl, renderer, spec);
      } else {
        panelView = new ContainerPanelView(doc, docCtrl, renderer, spec);
      }
      panelCtrl = docCtrl;
    }

    if (spec.createPanelController) {
      panelCtrl = spec.createPanelController(doc);
    }
    // let the spec create a view if a factory method is there
    if (spec.createPanelView) {
      panelView = spec.createPanelView(doc);
    }

    panel = new Panel(doc, spec, panelCtrl, panelView);
    return panel;
  };

};
PanelFactory.prototype = new PanelFactory.Prototype();

module.exports = PanelFactory;
