"use strict";

var _ = require("underscore");
var util = require('substance-util');
var html = util.html;
var View = require("substance-application").View;
var CollectionView = require("./collection");


// Substance.Library.View
// ==========================================================================
//
// The Substance Document Editor

var LibraryView = function(library) {
  View.call(this);

  this.$el.addClass('library');
  this.library = library;

  this.collectionView = new CollectionView(library);
};

LibraryView.Prototype = function() {

  // Rendering
  // --------
  //

  this.render = function() {
    this.$el.html(html.tpl('library', this.library));

    // // Render current collection
    this.$('.collection').replaceWith(this.collectionView.render().el);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };
};

LibraryView.Prototype.prototype = View.prototype;
LibraryView.prototype = new LibraryView.Prototype();

module.exports = LibraryView;
