"use strict";

var _ = require('underscore');
var Workflow = require('./workflow');

var ToggleResourceReference = function() {
  Workflow.apply(this, arguments);

  this.handlers = [];
  this.panelForRef = {};
};

ToggleResourceReference.Prototype = function() {

  this.registerHandlers = function() {
    // Register event delegates to react on clicks on a reference node in the content panel
    _.each(this.readerCtrl.panels, function(panel) {
      var name = panel.getName();
      var config = panel.getConfig();
      _.each(config.references, function(refType) {
        this.panelForRef[refType] = name;
        var handler = _.bind(this.toggleResourceReference, this, name);
        this.handlers.push(handler);
        this.readerView.$el.on('click', '.annotation.' + refType, handler);
      }, this);
    }, this);
  };

  this.unRegisterHandlers = function() {
    for (var i = 0; i < this.handlers.length; i++) {
      this.readerView.$el.off('click', this.handlers[i]);
    }
  };

  this.handlesStateUpdate = true;

  this.handleStateUpdate = function(state, stateInfo) {
    // if the reference type is registered with this workflow
    // open the panel and show highlights
    if (stateInfo.focussedNode && this.panelForRef[stateInfo.focussedNode.type]) {
      var ref = stateInfo.focussedNode;
      var panel = this.panelForRef[ref.type];
      var panelView = this.readerView.panelViews[panel];
      var contentView = this.readerView.contentView;
      var resourceId = ref.target;
      // show the associated panel, hihglight the resource and scroll to its position
      panelView.activate();
      var classes = ["highlighted"];
      if (state.fullscreen) classes.push("fullscreen");
      panelView.addHighlight(resourceId, classes.join(" "));
      panelView.scrollTo(resourceId);
      // panelView.scrollbar.update();
      // highlight all other references in the content panel for the same resource
      var refs = this.readerView.resources.get(resourceId);
      delete refs[ref.id];
      _.each(refs, function(ref) {
        contentView.addHighlight(ref.id, "highlighted");
      }, this);
      // contentView.scrollbar.update();
      return true;
    }
    return false;
  };

  this.toggleResourceReference = function(panel, e) {
    e.preventDefault();
    e.stopPropagation();

    var state = this.readerCtrl.state;
    var refId = e.currentTarget.dataset.id;
    // If the resource is active currently, deactivate it
    if (refId === state.focussedNode) {
      this.readerCtrl.modifyState({
        panel: this.readerCtrl.currentPanel,
        focussedNode: null
      });
    }
    else {
      this.readerView.saveScroll();
      this.readerCtrl.modifyState({
        panel: "content",
        focussedNode: refId
      });
    }
  };

};
ToggleResourceReference.Prototype.prototype = Workflow.prototype;
ToggleResourceReference.prototype = new ToggleResourceReference.Prototype();

module.exports = ToggleResourceReference;
