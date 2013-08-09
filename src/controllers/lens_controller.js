"use strict";

var _ = require("underscore");
var Session = require("../models/session");
var LibraryController = require("./library_controller");
var ArticleController = require("lens-article/article_controller");
var util = require("substance-util");
var Controller = require("substance-application").Controller;
var LensView = require("../views/lens");
var Test = require("substance-test");


// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(env) {
  Controller.call(this);
  this.session = new Session(env);

  // Create main view
  this.view = new LensView(this);

  // Main controls
  this.on('open:article', this.openArticle);
  this.on('open:library', this.openLibrary);
  this.on('open:login', this.openLogin);
  this.on('open:test_center', this.openTestCenter);
};


LensController.Prototype = function() {

  // Transitions
  // ===================================

  this.openArticle = function(documentId) {
    console.log('open article', documentId);
    var that = this;

    this.session.loadDocument(documentId, function(err, doc) {
      console.log('YOYO');
      if (err) throw "Loading failed";
      that.article = new ArticleController(doc);
      console.log('YOYO');
      that.updateState('article');
    });
  };

  this.openLibrary = function() {
    console.log('opening library');

    this.library = new LibraryController();
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
    cb = cb || function(err) {
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
