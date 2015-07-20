var _ = require('underscore');
var Lens = require('lens/reader');
var Workflow = Lens.Workflow;

var ToggleFormula = function() {
  Workflow.call(this);
};
ToggleFormula.Prototype = function() {

  this.registerHandlers = function() {
    this.mathPanel = this.readerView.panelViews['math'];
    this.readerView.$el.on('click', '.formula > .content > .corners', this.mathPanel._onToggleResource);
 };

  this.unRegisterHandlers = function() {
    this.readerView.$el.off('click', '.formula > .content > .corners', this.mathPanel._onToggleResource);
    this.mathPanel = null;
  };

  this.handlesStateUpdate = true;

  this.handleStateUpdate = function(state, stateInfo) {
    var focussedNode = stateInfo.focussedNode;
    if (focussedNode && focussedNode.type === "formula_reference") {
      var mathPanel = this.mathPanel;
      var doc = mathPanel.getDocument();

      // TODO: this is a bit hacky. In a formula ref we have a path (deep address) but we can't use it to resolve something
      // from the document. I.e., maybe it would be better to not use an explicit representation?
      var resource = doc.get(focussedNode.target[0]);
      var envId = null;
      var formulaId = null;

      if (resource.type === "math_environment") {
        envId = resource.id;
        resource = doc.get(focussedNode.target[1]);
        formulaId = resource.id;
      } else {
        formulaId = resource.id;
      }

      // show math panel and activate environment or formula
      var formulaRefs = this.readerView.resources.get(formulaId);
      if (envId) {
        mathPanel.activate();
        mathPanel.addHighlight(envId, "highlighted");
        mathPanel.scrollTo(envId);
      } else if (Object.keys(formulaRefs).length > 0) {
        mathPanel.activate();
        mathPanel.addHighlight(formulaId, "highlighted");
        mathPanel.scrollTo(formulaId);
      }

      var refs = this.readerView.resources.get(focussedNode.target);

      // highlight references to the environment, as well the main occurrence in the content-panel
      var contentView = this.readerView.contentView;
      _.each(refs, function(ref) {
        if (ref.id === focussedNode.id) return;
        contentView.addHighlight(ref.id, "highlighted");
      }, this);
      contentView.addHighlight(envId || formulaId, "highlighted main-occurrence");

      return true;
    }
    return false;
  };

};
ToggleFormula.Prototype.prototype = Workflow.prototype;
ToggleFormula.prototype = new ToggleFormula.Prototype();

module.exports = ToggleFormula;
