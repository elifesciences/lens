"use strict";

var Panel = function(config) {
  this.config = config;
  this.config.label = config.title;
};

Panel.Prototype = function() {

  /* jshint unused:false */

  this.createController = function(doc) {
    throw new Error("this method is abstract");
  };

  this.getName = function() {
    return this.config.name;
  };

  this.getConfig = function() {
    return this.config;
  };

};
Panel.prototype = new Panel.Prototype();
Panel.prototype.constructor = Panel;

module.exports = Panel;
