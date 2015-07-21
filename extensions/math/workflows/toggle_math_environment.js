var _ = require('underscore');
var Lens = require('lens/reader');
var Workflow = Lens.Workflow;

var ToggleMathEnvironment = function() {
  Workflow.call(this);
  this._jumpToMainOccurrence = _.bind(this.jumpToMainOccurrence, this);
};

ToggleMathEnvironment.Prototype = function() {

  this.registerHandlers = function() {
    this.mathPanel = this.readerView.panelViews['math'];
    this.readerView.$el.on('click', '.math-environment > .content > .corners', this.mathPanel._onToggleResource);
    this.readerView.$el.on('click', '.panel.math a.jump-to-resource', this._jumpToMainOccurrence);
  };

  this.unRegisterHandlers = function() {
    this.readerView.$el.off('click', '.math-environment > .content > .corners', this.mathPanel._onToggleResource);
    this.readerView.$el.off('click', '.panel.math a.jump-to-resource', this._jumpToMainOccurrence);
    this.mathPanel = null;
  };

  this.handlesStateUpdate = true;

  this.handleStateUpdate = function(state, stateInfo) {
    var focussedNode = stateInfo.focussedNode;
    var mathPanel = this.readerView.panelViews.math;
    // after activating a math_environment_reference with toggleReference
    if (focussedNode) {
      var envId = null;
      if (focussedNode.type === "math_environment")  {
        envId = state.focussedNode;
      } else if (focussedNode.type === "math_environment_reference") {
        envId = stateInfo.focussedNode.target;
        mathPanel.addHighlight(envId, "highlighted");
      } else if (focussedNode.type === "formula") {
        envId = state.focussedNode;
      } else {
        return false;
      }
      mathPanel.activate();
      mathPanel.scrollTo(envId);

      // highlight references to the environment, as well the main occurrence in the content-panel
      var contentView = this.readerView.contentView;
      var refs = this.readerView.resources.get(envId);
      _.each(refs, function(ref) {
        if (ref.id === focussedNode.id) return;
        contentView.addHighlight(ref.id, "highlighted");
      }, this);
      contentView.addHighlight(envId, "highlighted main-occurrence");
      if (state.panel === "content" && envId) {
        mathPanel.addHighlight(envId, "highlighted");
      }
      return true;
    }

    return false;
  };

  this.jumpToMainOccurrence = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var element = $(e.currentTarget).parents('.content-node')[0];
    var nodeId = element.dataset.id;
    this.readerCtrl.modifyState({
      panel: "math",
      focussedNode: nodeId
    });
    this.readerView.contentView.scrollTo(nodeId);
  };

};
ToggleMathEnvironment.Prototype.prototype = Workflow.prototype;
ToggleMathEnvironment.prototype = new ToggleMathEnvironment.Prototype();

module.exports = ToggleMathEnvironment;
