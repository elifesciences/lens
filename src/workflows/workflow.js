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

  this.registerHandlers = function() {
    throw new Error('This method is abstract');
  };

  this.detach = function() {
    this.unRegisterHandlers();
    this.readerView = null;
    this.readerController = null;
  };

  this.unRegisterHandlers = function() {
    throw new Error('This method is abstract');
  };

  // override this method if state changes are relevant
  this.handlesStateUpdate = false;

  this.handleStateUpdate = function(state) {
    throw new Error('This method is abstract');
  };

};
Workflow.prototype = new Workflow.Prototype();

module.exports = Workflow;
