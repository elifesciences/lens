"use strict";

var Backbone = require("../lib/backbone");

var Router = Backbone.Router.extend({
  initialize: function(options) {
    this.controller = options.controller;

    // Using this.route, because order matters
    this.route(':document', 'document', this.article);
    this.route('documents/:document', 'document', this.article);

    this.route('tests', 'test_center', this.testCenter);
    this.route('tests/:suite', 'test_center', this.testCenter);

    this.route('', 'start', this.library);
  },

  // Test Center
  // --------
  //

  testCenter: function(suite) {
    this.dispatch('open:test_center', [suite]);
  },

  // Editor View
  // --------
  //

  library: function() {
    console.log('opening the library');
    this.dispatch('open:library', [document]);
  },


  // Editor View
  // --------
  //

  article: function(article) {
    console.log('opening article...', article);
    this.dispatch('open:article', [article]);
  },


  // Create a new document
  // --------
  //

  // newDocument: function() {
  //   this.dispatch('create:document');
  // },

  // Dispatch all routes to the controller's event system
  // --------
  //
  // We normalize all messages in our app and thus
  // hand it over to the session event system

  dispatch: function(message, args) {
    args = [message].concat(args || []);
    this.controller.trigger.apply(this.controller, args);
  }

});

module.exports = Router;
