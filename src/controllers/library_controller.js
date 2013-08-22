"use strict";

var _ = require("underscore");
var Controller = require("substance-application").Controller;
var LibraryView = require("../views/library");
var util = require("substance-util");


// Substance.Library.Controller
// -----------------
//

var LibraryController = function(library) {
  this.library = library; 

  this.collection = this.library.getCollection("docs");

  Controller.call(this);
  
  // Create library view
  this.view = new LibraryView(this);
};


LibraryController.Prototype = function() {

  this.createView = function() {
    var view = new LibraryView(this);
    return view;
  };

  // Transitions
  // ==================================


  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  // 
  // E.g., when a document is opened:
  //    ["application", "document"]
  // with controllers taking responisbility:
  //    [this, this.document]
  //
  // The child controller (e.g., document) should itself be allowed to have sub-controllers.
  // For sake of prototyping this is implemented manually right now.
  // TODO: discuss naming

  this.getActiveControllers = function() {
    var result = [ ["sandbox", this] ];

    var state = this.state;

    if (state === "editor") {
      result = result.concat(this.editor.getActiveControllers());
    } else if (state === "test_center") {
      result.push(["test_center", this.testRunner]);
    }
    return result;
  };
};


// Exports
// --------

LibraryController.Prototype.prototype = Controller.prototype;
LibraryController.prototype = new LibraryController.Prototype();
_.extend(LibraryController.prototype, util.Events);


module.exports = LibraryController;
