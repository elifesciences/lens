"use strict";
var Controller = require("../../substance/application").Controller;
var _ = require("underscore");
var util = require("../../substance/util");


// Panel.Controller
// -----------------
//
// Controls a panel

var PanelController = function(document, config) {
  this.document = document;
  this.config = config;
};

PanelController.Prototype = function() {
  var __super__ = Controller.prototype;

  this.createView = function() {
    throw new Error("this is an abstract method");
  };

  this.getConfig = function() {
    return this.config;
  };

  this.getName = function() {
    return this.config.name;
  };

  this.getDocument = function() {
    return this.document;
  };

};

PanelController.Prototype.prototype = Controller.prototype;
PanelController.prototype = new PanelController.Prototype();

module.exports = PanelController;
