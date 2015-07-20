"use strict";

var Workflow = function() {
  this.readerController = null;
  this.readerView = null;
};

Workflow.Prototype = function() {

  /* jshint unused:false */

  this.attach = function(readerController, readerView) {
    this.readerCtrl = readerController;
    this.readerView = readerView;
    this.registerHandlers();
  };

  this.detach = function() {
    this.unRegisterHandlers();
    this.readerView = null;
    this.readerController = null;
  };

  this.registerHandlers = function() {
    throw new Error('This method is abstract');
  };

  this.unRegisterHandlers = function() {
    throw new Error('This method is abstract');
  };

  // override this if state changes are relevant
  this.handlesStateUpdate = false;

  // override this method and return true if the state update is handled by this workflow
  this.handleStateUpdate = function(state, stateInfo) {
    throw new Error('This method is abstract');
  };

};
Workflow.prototype = new Workflow.Prototype();

module.exports = Workflow;
