"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Controller = require("substance-application").Controller;
var LensView = require("./lens_view");
var ReaderController = require("./reader_controller");
var Article = require("lens-article");

// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(config) {
  Controller.call(this);

  this.config = config;

  this.converter = config.converter;

  // Main controls
  this.on('open:reader', this.openReader);
};

var CONVERTER_OPTIONS = {
  TRIM_WHITESPACES: true,
  REMOVE_INNER_WS: true
};

LensController.Prototype = function() {

  // Initial view creation
  // ===================================

  this.createView = function() {
    var view = new LensView(this);
    this.view = view;
    return view;
  };

  // After a file gets drag and dropped it will be remembered in Local Storage
  // ---------

  this.importXML = function(xml) {
    // var importer = new Converter.Importer();
    var doc = this.converter.import(xml, CONVERTER_OPTIONS);
    this.createReader(doc, {
      context: 'toc'
    });
  };

  // Update URL Fragment
  // -------
  //
  // This will be obsolete once we have a proper router vs app state
  // integration.

  this.updatePath = function(state) {
    var path = [];

    path.push(state.context);

    if (state.node) {
      path.push(state.node);
    } else {
      path.push('all');
    }

    if (state.resource) {
      path.push(state.resource);
    }

    if (state.fullscreen) {
      path.push('fullscreen');
    }

    window.app.router.navigate(path.join('/'), {
      trigger: false,
      replace: false
    });
  };

  this.createReader = function(doc, state) {
    var that = this;

    // Create new reader controller instance
    this.reader = new ReaderController(doc, state, this.config);

    this.reader.on('state-changed', function() {
      that.updatePath(that.reader.state);
    });

    this.modifyState({
      context: 'reader'
    });
  };

  this.openReader = function(context, node, resource, fullscreen) {
    var that = this;

    // The article view state
    var state = {
      context: context || "toc",
      node: node,
      resource: resource,
      fullscreen: !!fullscreen
    };

    // Already loaded?
    if (this.reader) {
      this.reader.modifyState(state);
      // HACK: This shouldn't be monkeypatched
      if (state.resource) this.reader.view.jumpToResource(state.resource);
    } else if (this.config.document_url === "lens_article.xml") {
      var doc = Article.describe();
      that.createReader(doc, state);
    } else {
      this.trigger("loading:started", "Loading article");
      $.ajax( this.config.document_url, {
        type: 'GET',
        crossDomain: true,
        headers: {
          Accept: "application/xml"
        }
      } ).done(function(data) {
        var doc;

        // Determine type of resource
        var xml = $.isXMLDoc(data);

        // Process XML file
        if (xml) {
          doc = that.converter.import(data, CONVERTER_OPTIONS);
        } else {
          if(typeof data == 'string') data = $.parseJSON(data);
          doc = Article.fromSnapshot(data);
        }

        // Extract headings
        // TODO: this should be solved with an index on the document level
        // This same code occurs in TOCView!

        if (state.context === "toc" && doc.getHeadings().length <= 2) {
          state.context = "info";
        }

        that.createReader(doc, state);
      })
      .fail(function(err) {
        that.view.startLoading("Error during loading. Please try again.");
        console.error(err);
      });
    }
  };

  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  //

  this.getActiveControllers = function() {
    var result = [["lens", this]];
    result.push(["reader", this.reader]);
    return result;
  };
};


// Exports
// --------

LensController.Prototype.prototype = Controller.prototype;
LensController.prototype = new LensController.Prototype();
_.extend(LensController.prototype, util.Events);

module.exports = LensController;
