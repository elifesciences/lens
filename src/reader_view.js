"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var Data = require("substance-data");
var Index = Data.Graph.Index;
var $$ = require("substance-application").$$;

// Lens.Reader.View
// ==========================================================================
//

var ReaderView = function(readerCtrl) {
  View.call(this);

  // Controllers
  // --------

  this.readerCtrl = readerCtrl;
  this.doc = this.readerCtrl.getDocument();

  this.$el.addClass('article');
  this.$el.addClass(this.doc.schema.id); // Substance article or lens article?

  // Stores latest body scroll positions per panel

  this.bodyScroll = {};

  // Panels
  // ------
  // Note: ATM, it is not possible to override the content panel + toc via panelSpecification
  this.contentView = readerCtrl.panelCtrls.content.createView();
  this.tocView = this.contentView.getTocView();

  this.panelViews = {};
  _.each(readerCtrl.panels, function(panel) {
    var panelCtrl = readerCtrl.panelCtrls[panel.getName()];
    this.panelViews[panel.getName()] = panelCtrl.createView();
  }, this);
  this.panelViews['toc'] = this.tocView;

  // Keep an index for resources
  this.resources = new Index(this.readerCtrl.getDocument(), {
    types: ["resource_reference"],
    property: "target"
  });

  // Events
  // --------
  //

  this._onClickPanel = _.bind( this.switchPanel, this );

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);

  this.registerContentHandlers();
};


ReaderView.Prototype = function() {

  // TODO: this is still not elegant enough. Maybe this is a place where we could hook in something like 'behaviors' (~workflows)?
  // at least it should be easier to add handlers without needing to derive ReaderView.
  this.registerContentHandlers = function() {

    // Register event delegates to react on clicks on a reference node in the content panel
    _.each(this.readerCtrl.panels, function(panel) {
      var name = panel.getName();
      var config = panel.getConfig();
      _.each(config.references, function(refType) {
        this.$el.on('click', '.annotation.' + refType, _.bind(this.toggleResourceReference, this, name));
      }, this);
    }, this);

    this.$el.on('click', '.annotation.cross_reference', _.bind(this.followCrossReference, this));

    // NOTE: deactivated anchoring when clicking on heading
    //       We decided to do so, as there were use-cases were link behavior was preferred.
    // this.$el.on('click', '.document .content-node.heading', _.bind(this.setAnchor, this));

    // TODO: are these currently rendered? i.e. jump-to-top buttons?
    this.$el.on('click', '.document .content-node.heading .top', _.bind(this.gotoTop, this));
  };

  // Rendering
  // --------
  //

  this.render = function() {
    var state = this.getState();
    var frag = document.createDocumentFragment();

    // Prepare doc view
    // --------

    frag.appendChild(this.contentView.render().el);

    // Prepare panel toggles
    // --------

    var panelToggles = $$('.context-toggles');
    panelToggles.appendChild(this.tocView.getToggleControl());
    this.tocView.on('toggle', this._onClickPanel);

    _.each(this.readerCtrl.panels, function(panel) {
      var panelView = this.panelViews[panel.getName()];
      var toggleEl = panelView.getToggleControl();
      panelToggles.appendChild(toggleEl);
      panelView.on('toggle', this._onClickPanel);
    }, this);

    // Prepare resources view
    // --------

    var medialStrip = $$('.medial-strip');
    medialStrip.appendChild($$('.separator-line'));
    medialStrip.appendChild(panelToggles);
    frag.appendChild(medialStrip);


    // Wrap everything within resources view
    var resourcesViewEl = $$('.resources');
    resourcesViewEl.appendChild(this.tocView.render().el);
    _.each(this.readerCtrl.panels, function(panel) {
      var panelView = this.panelViews[panel.getName()];
      // console.log('Rendering panel "%s"', name);
      resourcesViewEl.appendChild(panelView.render().el);
    }, this);
    frag.appendChild(resourcesViewEl);

    this.el.appendChild(frag);

    // Await next UI tick to update layout and outline
    _.delay(_.bind( function() {
      // Render outline that sticks on this.surface
      this.updateState();
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
    }, this), 1);

    // Wait for stuff to be rendered (e.g. formulas)
    // TODO: use a handler? MathJax.Hub.Queue(fn) does not work for some reason

    _.delay(_.bind( function() {
      this.updateOutline();
    }, this ), 2000);

    // Jump marks for the win
    if (state.left) {
      _.delay(_.bind(function() {
        this.contentView.jumpToNode(state.left);
        if (state.right) {
          // TODO: Brute force for now
          // Make sure to find out which resource view is currently active
          var panelView = this.panelViews[state.panel];
          panelView.jumpToResource(state.right);
        }
      }, this), 100);
    }

    // attach a lazy/debounced handler for resize events
    // that updates the outline of the currently active panels
    $(window).resize(_.debounce(_.bind(function() {
      this.updateOutline();
    }, this), 1) );

    return this;
  };

  // Free the memory.
  // --------
  //

  this.dispose = function() {
    this.contentView.dispose();
    _.each(this.panelViews, function(panelView) {
      panelView.off('toggle', this._onClickPanel);
      panelView.dispose();
    });
    this.resources.dispose();
    this.stopListening();
  };


  this.getState = function() {
    return this.readerCtrl.state;
  };

  // Toggles on and off the zoom
  // --------
  //

  this.toggleFullscreen = function(resourceId) {
    var state = this.readerCtrl.state;
    // Always activate the resource
    this.readerCtrl.modifyState({
      right: resourceId,
      fullscreen: !state.fullscreen
    });
  };

  this.getContentContainer = function() {
    return this.readerCtrl.panelCtrls.content.getContainer();
  };

  // Toggle Resource Reference
  // --------
  //

  this.toggleResourceReference = function(panel, e) {
    var state = this.readerCtrl.state;
    var refId = e.currentTarget.dataset.id;
    var ref = this.readerCtrl.getDocument().get(refId);
    var nodeId = this.getContentContainer().getRoot(ref.path[0]);
    var resourceId = ref.target;
    // If the resource is active currently, deactivate it
    if (resourceId === state.right) {
      this.readerCtrl.modifyState({
        panel: this.readerCtrl.currentPanel,
        left: null,
        right:  null
      });
    }
    // Otherwise, activate it und scroll to the resource
    else {
      this.saveScroll();
      this.readerCtrl.modifyState({
        panel: panel,
        left: nodeId,
        right: resourceId
      });
      this.panelViews[panel].jumpToResource(resourceId);
    }
    e.preventDefault();
  };

  // Follow cross reference
  // --------
  //

  this.followCrossReference = function(e) {
    var refId = e.currentTarget.dataset.id;
    var crossRef = this.readerCtrl.getDocument().get(refId);
    this.contentView.jumpToNode(crossRef.target);
  };

  this.gotoTop = function() {
    // Jump to cover node as that's easiest
    this.contentView.jumpToNode("cover");
    $(document).scrollTop(0);
    return false;
  };

  // Toggle on-off a resource
  // --------
  //

  this.toggleResource = function(id) {
    var state = this.readerCtrl.state;
    var node = state.left;
    // Toggle off if already on
    if (state.right === id) {
      id = null;
      node = null;
    }
    this.readerCtrl.modifyState({
      fullscreen: false,
      right: id,
      left: null
    });
  };

  // Toggle on-off node focus
  // --------
  //

  this.toggleNode = function(panel, nodeId) {
    var state = this.readerCtrl.state;
    if (state.left === nodeId && state.panel === panel) {
      // Toggle off -> reset, preserve the panel
      this.readerCtrl.modifyState({
        panel: this.readerCtrl.currentPanel,
        left: null,
        right: null
      });
    } else {
      this.readerCtrl.modifyState({
        panel: panel,
        left: nodeId,
        right: null
      });
    }
  };

  // Get scroll position of active panel
  // --------
  //
  // Content, Figures, Citations, Info

  this.getScroll = function() {
    // Only covers the mobile mode!
    return $(document).scrollTop();
  };

  // Recover scroll from previous state (if there is any)
  // --------
  //
  // TODO: retrieve from cookie to persist scroll pos over reload?

  this.recoverScroll = function() {
    var targetScroll = this.bodyScroll[this.getState().panel];
    if (targetScroll) {
      $(document).scrollTop(targetScroll);
    } else {
      // Scroll to top
      // $(document).scrollTop(0);
    }
  };

  // Save current scroll position
  // --------
  //

  this.saveScroll = function() {
    this.bodyScroll[this.getState().panel] = this.getScroll();
  };

  // Explicit panel switch
  // --------
  //
  // Only triggered by the explicit switch
  // Implicit panel switches happen when someone clicks a figure reference

  this.switchPanel = function(panel) {
    this.saveScroll();
    this.readerCtrl.switchPanel(panel);
    this.recoverScroll();
  };

  // Update Reader State
  // --------
  //
  // Called every time the controller state has been modified
  // Search for readerCtrl.modifyState occurences

  this.updateState = function(options) {
    options = options || {};
    var state = this.readerCtrl.state;
    // 'deactivate' previously 'active' nodes
    this.contentView.$('.content-node.active').removeClass('active');
    this.el.dataset.context = state.panel;
    if (state.left) {
      $(this.contentView.findNodeView(state.left)).addClass('active');
    }
    // According to the current panel show active resource panel
    // -------
    this.updateResource();
  };


  // Based on the current application state, highlight the current resource
  // -------
  //
  // Triggered by updateState

  this.updateResource = function() {
    var state = this.readerCtrl.state;
    this.$('.resources .content-node.active').removeClass('active fullscreen');
    this.contentView.$('.annotation.active').removeClass('active');
    if (state.right) {
      var resourcePanel = this.panelViews[state.panel];
      // Show selected resource
      var $res = $(resourcePanel.findNodeView(state.right));
      $res.addClass('active');
      if (state.fullscreen) $res.addClass('fullscreen');
      // Mark all annotations that reference the resource
      var annotations = this.resources.get(state.right);
      _.each(annotations, function(a) {
        $(this.contentView.findNodeView(a.id)).addClass('active');
      }, this);
    } else {
      this.recoverScroll();
      // Hide all resources (see above)
    }
    _.each(this.panelViews, function(panelView) {
      panelView.hide();
    });
    this.panelViews[state.panel].activate();
    this.updateOutline();
  };

  // Whenever the app state changes
  // --------
  //
  // Triggered by updateResource.

  this.updateOutline = function() {
    var state = this.getState();
    var nodes = this.getResourceReferenceContainers();
    this.contentView.updateOutline({
      context: state.panel,
      selectedNode: state.left,
      highlightedNodes: nodes
    });
    var panelView = this.panelViews[state.panel];
    if(panelView.hasOutline) panelView.updateOutline({
      context: state.panel,
      selectedNode: state.left,
      highlightedNodes: [state.right]
    });
  };

  this.getResourceReferenceContainers = function() {
    var state = this.readerCtrl.state;
    if (!state.right) return [];
    // A reference is an annotation node. We want to highlight
    // all (top-level) nodes that contain a reference to the currently activated resource
    // For that we take all references pointing to the resource
    // and find the root of the node on which the annotation sticks on.
    var references = this.resources.get(state.right);
    var container = this.getContentContainer();
    var nodes = _.uniq(_.map(references, function(ref) {
      var nodeId = container.getRoot(ref.path[0]);
      return nodeId;
    }));
    return nodes;
  };

  this.jumpToResource = function(resourceId) {
    var state =  this.getState();
    var panelView = this.panelViews[state.panel];
    panelView.jumpToResource(resourceId);
  };
};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;
