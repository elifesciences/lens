"use strict";

var _ = require("underscore");
var View = require("../substance/application").View;
var $$ = require("../substance/application").$$;

// Lens.View Constructor
// ========
//

var LensView = function(controller) {
  View.call(this);

  this.controller = controller;
  this.$el.attr({id: "container"});

  // Handle state transitions
  // --------

  this.listenTo(this.controller, 'state-changed', this.onStateChanged);
  this.listenTo(this.controller, 'loading:started', this.startLoading);

  $(document).on('dragover', function () { return false; });
  $(document).on('ondragend', function () { return false; });
  $(document).on('drop', this.handleDroppedFile.bind(this));
};

LensView.Prototype = function() {

  this.handleDroppedFile = function(/*e*/) {
    var ctrl = this.controller;
    var files = event.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
      ctrl.importXML(e.target.result);
    };

    reader.readAsText(file);
    return false;
  };

  // Session Event handlers
  // --------
  //

  this.onStateChanged = function() {
    var state = this.controller.state;
    if (state.context === "reader") {
      this.openReader();
    } else {
      console.log("Unknown application state: " + state);
    }
  };

  this.startLoading = function(msg) {
    if (!msg) msg = "Loading article";
    $('.spinner-wrapper .message').html(msg);
    $('body').addClass('loading');
  };

  this.stopLoading = function() {
    $('body').removeClass('loading');
  };


  // Open the reader view
  // ----------
  //

  this.openReader = function() {
    var view = this.controller.reader.createView();
    var that = this;

    that.replaceMainView('reader', view);
    that.startLoading("Typesetting");

    this.$('#main').css({opacity: 0});

    _.delay(function() {
      that.stopLoading();
      that.$('#main').css({opacity: 1});
    }, 1000);
  };

  // Rendering
  // ==========================================================================
  //

  this.replaceMainView = function(name, view) {
    $('body').removeClass().addClass('current-view '+name);

    if (this.mainView && this.mainView !== view) {
      this.mainView.dispose();
    }

    this.mainView = view;
    this.$('#main').html(view.render().el);
  };

  this.render = function() {
    this.el.innerHTML = "";

    // Browser not supported dialogue
    // ------------

    this.el.appendChild($$('.browser-not-supported', {
      text: "Sorry, your browser is not supported.",
      style: "display: none;"
    }));

    // Spinner
    // ------------

    this.el.appendChild($$('.spinner-wrapper', {
      children: [
        $$('.spinner'),
        $$('.message', {html: 'Loading article'})
      ]
    }));

    // Main container
    // ------------

    this.el.appendChild($$('#main'));
    return this;
  };

  this.dispose = function() {
    this.stopListening();
    if (this.mainView) this.mainView.dispose();
  };
};


// Export
// --------

LensView.Prototype.prototype = View.prototype;
LensView.prototype = new LensView.Prototype();

module.exports = LensView;