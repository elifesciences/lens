"use strict";

var _ = require('underscore');
var Controller = require("../substance/application").Controller;
var ReaderView = require("./reader_view");
var ContentPanel = require("./panels/content");

// Reader.Controller
// -----------------
//
// Controls the Reader.View

var ReaderController = function(doc, state, options) {

  // Private reference to the document
  this.__document = doc;

  this.options = options || {};

  this.panels = options.panels;
  this.contentPanel = new ContentPanel(doc);

  // create panel controllers
  this.panelCtrls = {};
  this.panelCtrls['content'] = this.contentPanel.createController(doc);
  _.each(this.panels, function(panel) {
    this.panelCtrls[panel.getName()] = panel.createController(doc);
  }, this);

  this.workflows = options.workflows || [];

  this.state = state;

  // Current explicitly set panel
  this.currentPanel = "toc";
};

ReaderController.Prototype = function() {

  this.createView = function() {
    if (!this.view) this.view = new ReaderView(this);
    return this.view;
  };

  // Explicit panel switch
  // --------
  //

  this.switchPanel = function(panel) {
    this.currentPanel = panel;
    this.modifyState({
      panel: panel,
      focussedNode: null,
      fullscreen: false
    });
  };

  this.getDocument = function() {
    return this.__document;
  };
};

ReaderController.Prototype.prototype = Controller.prototype;
ReaderController.prototype = new ReaderController.Prototype();

module.exports = ReaderController;
