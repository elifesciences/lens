"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Controller = require("substance-application").Controller;
var LensView = require("../views/lens");
var Test = require("substance-test");
var Library = require("substance-library");
var LibraryController = Library.Controller;
var ReaderController = require("lens-reader").Controller;
var Article = require("lens-article");
var Chronicle = require("substance-chronicle");
var Converter = require("lens-converter");

// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(config) {
  Controller.call(this);

  this.config = config;

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


  // Loaders
  // --------

  this.loadLibrary = function(url, cb) {
    var that = this;
    if (this.__library) return cb(null);

    $.getJSON(url, function(data) {
      that.__library = new Library({
        seed: data
      });
      cb(null);
    }).error(cb);
  };

  // Transitions
  // ===================================

  var _XML_MATCHER = new RegExp("[.]xml$");

  var _open = function(state, documentId) {

    var that = this;

    var _onDocumentLoad = function(err, doc) {
      // Hmmm... I don't think that this exception will work as desired...
      if (err) throw err;
      that.reader = new ReaderController(doc, state);
      that.updateState('reader');
    };

    // HACK: for activating the NLM importer ATM it is not possible
    // to leave the loading to the library as it needs the Lens Converter for that.
    // Options:
    //  - provide the library with a document loader which would be constructed here
    //  - do the loading here
    // prefering option2 as it is simpler to achieve...

    var record = this.__library.get(documentId);
    if (_XML_MATCHER.exec(record.url.toLowerCase()) !== null) {
      var importer = new Converter.Importer();
      $.get(record.url)
        .done(function(data) {
          var doc, err;
          try {
            doc = importer.import(data);
          } catch (_err) {
            err = _err;
          }
          _onDocumentLoad(err, doc);
        })
        .fail(function(err) {
          console.error(err);
        });
    } else {
      $.getJSON(record.url)
      .done(function(data) {
        var doc = Article.fromSnapshot(data, {
          chronicle: Chronicle.create()
        });
        _onDocumentLoad(null, doc);
      })
      .fail(function(err) {
        console.error(err);
      });
    }
  };

  this.openReader = function(collectionId, documentId, context, node, resource, fullscreen) {
    // The article view state
    var state = {
      context: context || "toc",
      node: node,
      resource: resource,
      fullscreen: !!fullscreen,
      collection: collectionId // TODO: get rid of the library dependency here
    };

    // Ensure the library is loaded
    this.loadLibrary(this.config.library_url, _open.bind(this, state, documentId));
  };

  this.openLibrary = function(collectionId) {
    var that = this;

    function open() {
      // Defaults to lens collection
      var state = {
        collection: collectionId || that.__library.collections[0].id // "lens"
      };

      that.library = new LibraryController(that.__library, state);
      that.updateState('library');
    }

    // Ensure the library is loaded
    this.loadLibrary(this.config.library_url, open);
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
