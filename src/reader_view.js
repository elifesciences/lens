"use strict";

var _ = require("underscore");
var Outline = require("lens-outline");
var View = require("substance-application").View;
var Data = require("substance-data");
var Index = Data.Graph.Index;
var $$ = require("substance-application").$$;

var CORRECTION = 0; // Extra offset from the top

// Lens.Reader.View
// ==========================================================================
//

var ReaderView = function(readerCtrl) {
  View.call(this);

  // Controllers
  // --------

  this.readerCtrl = readerCtrl;
  this.doc = this.readerCtrl.getDocument();
  this.panelFactory = readerCtrl.panelFactory;

  this.$el.addClass('article');
  this.$el.addClass(this.doc.schema.id); // Substance article or lens article?

  // Stores latest body scroll positions per context
  // Only relevant
  this.bodyScroll = {};

  // Surfaces
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.contentView = readerCtrl.contentPanel.getView();

  // Panels
  // ------
  this.panelViews = {};

  _.each(readerCtrl.panels, function(name, panel) {
    this.panelViews[name] = panel.getView();
  }, this);

  this.tocView = this.contentView.getTocView();

  // Keep an index for resources
  this.resources = new Index(this.readerCtrl.__document, {
    types: ["resource_reference"],
    property: "target"
  });

  // Events
  // --------
  //

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);

  // Register event delegates to react on clicks on a reference node in the content panel
  _.each(this.panelViews, function(panelView, name) {
    var spec = this.panelFactory.getSpec(name);
    _.each(spec.references, function(refType) {
      this.$el.on('click', '.annotation.' + refType, _.bind(this.toggleResourceReference, this, name));
    }, this);
  }, this);

  this.$el.on('click', '.annotation.cross_reference', _.bind(this.followCrossReference, this));

  // NOTE: deactivated anchoring when clicking on heading
  //       We decided to do so, as there were use-cases were link behavior was preferred.
  // this.$el.on('click', '.document .content-node.heading', _.bind(this.setAnchor, this));

  // TODO: are these currently rendered? i.e. jump-to-top buttons?
  this.$el.on('click', '.document .content-node.heading .top', _.bind(this.gotoTop, this));

  // TODO: what is this?
  // this.outline.$el.on('click', '.node', _.bind(this._jumpToNode, this));
};


ReaderView.Prototype = function() {

  // Rendering
  // --------
  //

  this.render = function() {
    var state = this.getState();
    var frag = document.createDocumentFragment();

    // Prepare doc view
    // --------

    var docViewEl = $$('.document');
    docViewEl.appendChild(this.contentView.render().el);
    docViewEl.appendChild(this.contentView.outline.el);
    frag.appendChild(docViewEl);

    // Prepare context toggles
    // --------

    var contextToggles = $$('.context-toggles');
    // TODO: consider the order of toggles
    contextToggles.appendChild(this.contentView.getToggleControl());
    _.each(this.panelViews, function(panelView, name) {
      var toggleEl = panelView.getToggleControl();
      // TODO: register to the panels toggle event
      // toggleEl.on('toggle', ...)
      contextToggles.appendChild(toggleEl);
    });

    // Prepare resources view
    // --------

    var medialStrip = $$('.medial-strip');
    medialStrip.appendChild($$('.separator-line'));
    medialStrip.appendChild(contextToggles);
    frag.appendChild(medialStrip);


    // Wrap everything within resources view
    var resourcesViewEl = $$('.resources');
    _.each(this.panelViews, function(panelView, name) {
      resourcesViewEl.appendChild(panelView.render().el)
    });
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
    if (state.node) {
      _.delay(_.bind(function() {
        this.contentView.jumpToNode(state.node);
        if (state.resource) {
          // TODO: Brute force for now
          // Make sure to find out which resource view is currently active
          var panelView = this.panelViews[state.context];
          panelView.jumpToResource(state.resource);
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
      resource: resourceId,
      fullscreen: !state.fullscreen
    });
  };

  // Toggle Resource Reference
  // --------
  //

  this.toggleResourceReference = function(context, e) {
    var state = this.readerCtrl.state;
    var refId = $(e.currentTarget).attr('id');
    var ref = this.readerCtrl.getDocument().get(refId);
    var nodeId = this.readerCtrl.contentPanel.getContainer().getRoot(ref.path[0]);
    var resourceId = ref.target;
    if (resourceId === state.resource) {
      this.readerCtrl.modifyState({
        context: this.readerCtrl.currentContext,
        node: null,
        resource:  null
      });
    } else {
      this.saveScroll();
      this.readerCtrl.modifyState({
        context: context,
        node: nodeId,
        resource: resourceId
      });
      this.panelViews[context].jumpToResource(resourceId);
    }
    e.preventDefault();
  };

  // Follow cross reference
  // --------
  //

  this.followCrossReference = function(e) {
    var refId = $(e.currentTarget).attr('id');
    var crossRef = this.readerCtrl.getDocument().get(refId);
    this.contentView.jumpToNode(crossRef.target);
  };

  // this.setAnchor = function(e) {
  //   this.toggleNode('toc', $(e.currentTarget).attr('id'));
  // };

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
    var node = state.node;
    // Toggle off if already on
    if (state.resource === id) {
      id = null;
      node = null;
    }
    this.readerCtrl.modifyState({
      fullscreen: false,
      resource: id,
      node: node
    });
  };

  // Toggle on-off node focus
  // --------
  //

  this.toggleNode = function(context, nodeId) {
    var state = this.readerCtrl.state;
    if (state.node === nodeId && state.context === context) {
      // Toggle off -> reset, preserve the context
      this.readerCtrl.modifyState({
        context: this.readerCtrl.currentContext,
        node: null,
        resource: null
      });
    } else {
      this.readerCtrl.modifyState({
        context: context,
        node: nodeId,
        resource: null
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
    var targetScroll = this.bodyScroll[this.getState().context];
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
    this.bodyScroll[this.getState().context] = this.getScroll();
  };

  // Explicit context switch
  // --------
  //
  // Only triggered by the explicit switch
  // Implicit context switches happen someone clicks a figure reference

  this.switchContext = function(context) {
    // var currentContext = this.readerCtrl.state.context;
    this.saveScroll();

    // Which view actions are triggered here?
    this.readerCtrl.switchContext(context);
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
    if (state.node) {
      this.contentView.$('#'+state.node).addClass('active');
    }
    // According to the current context show active resource panel
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

    if (state.resource) {
      // Show selected resource
      var $res = this.$('#'+state.resource);
      $res.addClass('active');
      if (state.fullscreen) $res.addClass('fullscreen');
      // Mark all annotations that reference the resource
      var annotations = this.resources.get(state.resource);
      _.each(annotations, function(a) {
        this.contentView.$('#'+a.id).addClass('active');
      }, this);
    } else {
      this.recoverScroll();
      // Hide all resources (see above)
    }
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
      context: state.context,
      selectedNode: state.node,
      highlightedNodes: nodes
    });
    this.panelViews[state.context].updateOutline({
      context: state.context,
      selectedNode: state.node,
      highlightedNodes: [state.resource]
    });
  };

  this.getResourceReferenceContainers = function() {
    var state = this.readerCtrl.state;
    if (!state.resource) return [];
    // A reference is an annotation node. We want to highlight
    // all (top-level) nodes that contain a reference to the currently activated resource
    // For that we take all references pointing to the resource
    // and find the root of the node on which the annotation sticks on.
    var references = this.resources.get(state.resource);
    var container = this.readerCtrl.contentCtrl.container;
    var nodes = _.uniq(_.map(references, function(ref) {
      var nodeId = container.getRoot(ref.path[0]);
      return nodeId;
    }));
    return nodes;
  };

};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;
