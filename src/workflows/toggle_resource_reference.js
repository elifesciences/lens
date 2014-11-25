"use strict";

var _ = require('underscore');
var Workflow = require('./workflow');

var ToggleResourceReference = function() {
  Workflow.apply(this, arguments);
};

ToggleResourceReference.Prototype = function() {

  this.registerHandlers = function() {
  };

  this.unRegisterHandlers = function() {
  };

  this.handlesStateUpdate = true;

  this.handleStateUpdate = function(state, stateInfo) {
    // if the reference type is registered with this workflow
    // open the panel and show highlights
    if (stateInfo.focussedNode && this.readerView.panelForRef[stateInfo.focussedNode.type]) {
      var ref = stateInfo.focussedNode;
      var panelName = this.readerView.panelForRef[ref.type];
      var panelView = this.readerView.panelViews[panelName];
      var contentView = this.readerView.contentView;
      var resourceId = ref.target;
      // show the associated panel, hihglight the resource and scroll to its position
      panelView.activate();
      var classes = ["highlighted"];
      panelView.addHighlight(resourceId, classes.join(" "));
      panelView.scrollTo(resourceId);
      // panelView.scrollbar.update();
      // highlight all other references in the content panel for the same resource
      var refs = this.readerView.resources.get(resourceId);
      delete refs[ref.id];
      _.each(refs, function(ref) {
        contentView.addHighlight(ref.id, "highlighted");
      }, this);
      return true;
    }
    return false;
  };

};
ToggleResourceReference.Prototype.prototype = Workflow.prototype;
ToggleResourceReference.prototype = new ToggleResourceReference.Prototype();

module.exports = ToggleResourceReference;
