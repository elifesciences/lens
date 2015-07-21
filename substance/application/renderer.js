"use strict";

var util = require("substance-util");


// Substance.Application.Renderer
// ==========================================================================
//
// Takes a data piece as an input and turns it into a DOM fragment, based on
// on the renderer specification
// We'll have one renderer per view in the future.

var Renderer = function(data) {
  this.data = data;
};

Renderer.Prototype = function() {

  // Finalize state transition
  // -----------------
  //
  // Editor View listens on state-changed events:
  //
  // E.g. this.listenTo(this, 'state-changed:comments', this.toggleComments);

  this.updateState = function(state, data) {
    var oldState = this.state;
    this.state = state;
    this.trigger('state-changed', this.state, oldState, data);
  };
};


// Setup prototype chain
Renderer.Prototype.prototype = util.Events;
Renderer.prototype = new Renderer.Prototype();

module.exports = Renderer;