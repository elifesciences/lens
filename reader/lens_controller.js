"use strict";

var _ = require('underscore');
var util = require("../substance/util");
var Controller = require('../substance/application').Controller;
var LensView = require("./lens_view");
var ReaderController = require('./reader_controller');
var LensArticle = require('../article');
var NLMConverter = require('../converter');


// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(config) {
  Controller.call(this);

  this.config = config;
  this.Article = config.articleClass || LensArticle;
  this.converter = config.converter;
  this.converters = config.converters;

  this.converterOptions = _.extend({}, NLMConverter.DefaultOptions, config.converterOptions);

  // Main controls
  this.on('open:reader', this.openReader);
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

  this.importXML = function(rawXML) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(rawXML,"text/xml");

    var doc = this.convertDocument(xmlDoc);
    this.createReader(doc, {
      panel: 'toc'
    });
  };

  // Update URL Fragment
  // -------
  //
  // This will be obsolete once we have a proper router vs app state
  // integration.

  this.updatePath = function(state) {
    var path = [];

    path.push(state.panel);

    if (state.focussedNode) {
      path.push(state.focussedNode);
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

  this.convertDocument = function(data) {
    var doc;
    var i = 0;
    while (!doc && i < this.converters.length) {
      var converter = this.converters[i];
      // First match will be used as the converter
      if (converter.test(data, this.config.document_url)) {
        doc = converter.import(data);
      }
      i += 1;
    }

    if (!doc) {
      throw new Error("No suitable converter found for this document", data);
    }

    return doc;
  };



  this.openReader = function(panel, focussedNode, fullscreen) {
    var that = this;

    // The article view state
    var state = {
      panel: panel || "toc",
      focussedNode: focussedNode,
      fullscreen: !!fullscreen
    };

    // Already loaded?
    if (this.reader) {
      this.reader.modifyState(state);
    } else if (this.config.document_url === "lens_article.xml") {
      var doc = this.Article.describe();
      that.createReader(doc, state);
    } else {
      this.trigger("loading:started", "Loading article");
      $.get(this.config.document_url)
      .done(function(data) {
        var doc;

        // Determine type of resource
        if ($.isXMLDoc(data)) {
          doc = that.convertDocument(data);
        } else {
          if(typeof data == 'string') data = $.parseJSON(data);
          doc = that.Article.fromSnapshot(data);
        }
        // Extract headings
        // TODO: this should be solved with an index on the document level
        // This same code occurs in TOCView!
        if (state.panel === "toc" && doc.getHeadings().length <= 2) {
          state.panel = "info";
        }
        that.createReader(doc, state);
      })
      .fail(function(err) {
        that.view.startLoading("Error during loading. Please try again.");
        console.error(err);
      });
    }
  };
};

// Exports
// --------

LensController.Prototype.prototype = Controller.prototype;
LensController.prototype = new LensController.Prototype();
_.extend(LensController.prototype, util.Events);

module.exports = LensController;
