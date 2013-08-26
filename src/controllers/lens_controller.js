"use strict";

var _ = require("underscore");
var Session = require("../models/session");
var util = require("substance-util");
var Controller = require("substance-application").Controller;
var LensView = require("../views/lens");
var Test = require("substance-test");

var Library = require("substance-library");
var LibraryController = Library.Controller;
var ReaderController = require("lens-reader").Controller;



// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(env) {
  Controller.call(this);
  this.session = new Session(env);

  this.__library = new Library({
    seed: require("../../data/lens_library.json")
  });

  // Main controls
  this.on('open:reader', this.openReader);
  this.on('open:library', this.openLibrary);
  this.on('open:login', this.openLogin);
  this.on('open:test_center', this.openTestCenter);
};

LensController.Prototype = function() {

  // Initial view creation
  // ===================================

  this.createView = function() {
    var view = new LensView(this);
    this.view = view;
    return view;
  };

  // Transitions
  // ===================================

  this.openReader = function(collectionId, documentId, context, node, resource) {
    var that = this;

    // The article view state
    var state = {
      context: context || "toc",
      node: node,
      resource: resource,
      collection: collectionId
    };

    this.__library.loadDocument(documentId, function(err, doc) {
      if (err) throw err;
      that.reader = new ReaderController(doc, state);
      that.updateState('reader');
    });
  };

  this.openLibrary = function(collectionId) {
    // TODO: Load library from backend
    // GET /libraries/lens.json

    // Defaults to lens collection
    var state = {
      collection: collectionId || "lens"
    };

    this.library = new LibraryController(this.__library, state);
    this.updateState('library');
  };

  // Test control center
  this.openTestCenter = function(suite) {
    this.testRunner = new Test.Runner();
    this.updateState('test_center', {report: suite});

    // TODO: Run all suites instead of just choosing a default
    this.runSuite(suite);
  };

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

    if (state === "article") {
      result = result.concat(this.article.getActiveControllers());
    } else if (state === "library") {
      result = result.concat(["library", this.library]);
    } else if (state === "test_center") {
      result.push(["test_center", this.testRunner]);
    }
    return result;
  };


  // Load and run testsuite
  // --------

  this.runSuite = function(suite, cb) {
    cb = cb || function(err) {
      if (err) console.log('ERROR', err);
    };

    if (!suite) return this.runAllSuites(cb);
    this.testRunner.runSuite(suite, cb);
  };


  // Load and run testsuite
  // --------

  this.runAllSuites = function(cb) {
    var suites = this.testRunner.getTestSuites();
    var testRunner = this.testRunner;

    var funcs = _.map(suites, function(suite, suiteName) {
      return function(data, cb) {
        testRunner.runSuite(suiteName, cb);
      };
    });

    util.async.sequential({
      functions: funcs,
      stopOnError: false
    }, cb);
  };
};


// Exports
// --------

LensController.Prototype.prototype = Controller.prototype;
LensController.prototype = new LensController.Prototype();
_.extend(LensController.prototype, util.Events);

module.exports = LensController;
