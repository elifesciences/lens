"use strict";

var util = require("../../substance/util");

// Substance.View
// ==========================================================================
//
// Application View abstraction, inspired by Backbone.js

var View = function(options) {
  options = options || {};
  var that = this;
  // Either use the provided element or make up a new element
  this.el = options.el || window.document.createElement(options.elementType || 'div');
  this.$el = $(this.el);

  this.dispatchDOMEvents();
};


View.Prototype = function() {


  // Shorthand for selecting elements within the view
  // ----------
  //

  this.$ = function(selector) {
    return this.$el.find(selector);
  };

  this.render = function() {
    return this;
  };

  // Dispatching DOM events (like clicks)
  // ----------
  //

  this.dispatchDOMEvents = function() {

    var that = this;

    // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
    // showReport(12) => ["showReport(12)", "showReport", "12"]
    function extractFunctionCall(str) {
      var match = /(\w+)\((.*)\)/.exec(str);
      if (!match) throw new Error("Invalid click handler '"+str+"'");

      return {
        "method": match[1],
        "args": match[2].split(',')
      };
    }

    this.$el.delegate('[sbs-click]', 'click', function(e) {
      console.error("FIXME: sbs-click is deprecated. Use jquery handlers with selectors instead.");

      // Matches things like this
      // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
      // showReport(12) => ["showReport(12)", "showReport", "12"]
      var fnCall = extractFunctionCall($(e.currentTarget).attr('sbs-click'));

      // Event bubbles up if there is no handler
      var method = that[fnCall.method];
      if (method) {
        e.stopPropagation();
        e.preventDefault();
        method.apply(that, fnCall.args);
        return false;
      }
    });
  };
};


View.Prototype.prototype = util.Events;
View.prototype = new View.Prototype();

module.exports = View;
