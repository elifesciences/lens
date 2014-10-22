"use strict";

var _ = require('underscore');
var Controller = require("substance-application").Controller;
var ReaderView = require("./reader_view");
var PanelFactory = require("./panel_factory");

// Reader.Controller
// -----------------
//
// Controls the Reader.View

var ReaderController = function(doc, state, options) {

  // Private reference to the document
  this.__document = doc;

  // E.g. context information
  this.options = options || {};

  this.panelFactory = options.panelFactory || new PanelFactory();

  // Reader state
  // -------

  this.panels = {};

  this.contentPanel = this.panelFactory.createPanel(doc, 'content');

  // skip 'content' and 'toc' as they are
  _.each(this.panelFactory.getNames(), function(name) {
    if (name === 'content' || name === 'toc') return;
    this.panels[name] = this.panelFactory.createPanel(doc, name);
  }, this);

  this.state = state;

  // Current explicitly set context
  this.currentContext = "toc";
};

ReaderController.Prototype = function() {

  this.createView = function() {
    if (!this.view) this.view = new ReaderView(this);
    return this.view;
  };

  // Explicit context switch
  // --------
  //

  this.switchContext = function(context) {
    // Remember scrollpos of previous context
    this.currentContext = context;

    this.modifyState({
      context: context,
      node: null,
      resource: null
    });
  };

  this.modifyState = function(state) {
    Controller.prototype.modifyState.call(this, state);
  };

  // TODO: Transition to ao new solid API
  // --------
  //

  this.getActiveControllers = function() {
    var result = [];
    result.push(["article", this]);
    result.push(["reader", this.panelCtrls[this.context]]);
    return result;
  };

  this.getDocument = function() {
    return this.__document;
  };

};


ReaderController.Prototype.prototype = Controller.prototype;
ReaderController.prototype = new ReaderController.Prototype();

module.exports = ReaderController;
