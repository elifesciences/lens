"use strict";

var _ = require('underscore');
var Workflow = require('./workflow');

var ToggleResourceReference = function() {
  Workflow.apply(this, arguments);

  this.handlers = [];
};

ToggleResourceReference.Prototype = function() {

  this.registerHandlers = function() {
    // Register event delegates to react on clicks on a reference node in the content panel
    _.each(this.readerCtrl.panels, function(panel) {
      var name = panel.getName();
      var config = panel.getConfig();
      _.each(config.references, function(refType) {
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

  this.toggleResourceReference = function(panel, e) {
    var state = this.readerCtrl.state;
    var refId = e.currentTarget.dataset.id;
    var doc = this.readerCtrl.getDocument();
    var ref = doc.get(refId);
    var nodeId = doc.get('content').getRoot(ref.path[0]);
    var resourceId = ref.target;
    // If the resource is active currently, deactivate it
    if (resourceId === state.right) {
      this.readerCtrl.modifyState({
        panel: this.readerCtrl.currentPanel,
        left: null,
        right:  null
      });
    }
    // Otherwise, activate it und scroll to the resource
    else {
      this.readerView.saveScroll();
      this.readerCtrl.modifyState({
        panel: panel,
        left: nodeId,
        right: resourceId
      });
      this.readerView.panelViews[panel].jumpToResource(resourceId);
    }
    e.preventDefault();
  };

};
ToggleResourceReference.Prototype.prototype = Workflow.prototype;
ToggleResourceReference.prototype = new ToggleResourceReference.Prototype();

module.exports = ToggleResourceReference;
