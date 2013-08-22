"use strict";

var _ = require("underscore");
var util = require('substance-util');
var html = util.html;
var View = require("substance-application").View;
var $$ = require("substance-application").$$;

// Substance.Collection.View
// ==========================================================================
//
// The Substance Collection display

var CollectionView = function(library) {
  View.call(this);

  this.$el.addClass('collection');
  this.library = library;
};

CollectionView.Prototype = function() {

  // Rendering
  // --------
  //
  // .collection
  //   .title

  this.render = function() {
    // Render the collection
    var records = this.library.collection.records;

    _.each(records, function(record) {
      this.el.appendChild($$('a.document', {
        href: "#"+record.id,
        children: [
          $$('.title', { text: record.title })
        ]
      }));
    }, this);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };
};

CollectionView.Prototype.prototype = View.prototype;
CollectionView.prototype = new CollectionView.Prototype();

module.exports = CollectionView;
