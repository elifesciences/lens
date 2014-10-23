"use strict";

var _ = require("underscore");

var Application = require("substance-application");
var View = Application.View;
var Controller = Application.Controller;

var Panel = function(doc, spec, ctrl, view) {
  this.doc = doc;
  this.name = spec.name;
  this.config = _.clone(spec);
  this.controller = ctrl ||  new Controller();
  this.view = view || new View();
};

Panel.Prototype = function() {

  this.getController = function() {
    return this.controller;
  };

  this.getView = function() {
    return this.view;
  };

  this.getDocument = function() {
    return this.doc;
  };

  this.getConfig = function() {
    return this.spec;
  };

  this.getName = function() {
    return this.name;
  };

  this.getContainer = function() {
    return this.controller.container;
  };

};

Panel.prototype = new Panel.Prototype();
Panel.prototype.constructor = Panel;

module.exports = Panel;
