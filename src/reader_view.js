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


  // whenever a workflow takes control set this variable
  // to be able to call it a last time when switching to another
  // workflow
  this.lastWorkflow = null;

  // Events
  // --------
  //

  this._onClickPanel = _.bind( this.switchPanel, this );

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);

  _.each(this.panelViews, function(panelView) {
    this.listenTo(panelView, "toggle-resource", this.onToggleResource);
  }, this);

  // attach workflows
  _.each(this.readerCtrl.workflows, function(workflow) {
    workflow.attach(this.readerCtrl, this);
  }, this);

  // attach a lazy/debounced handler for resize events
  // that updates the outline of the currently active panels
  $(window).resize(_.debounce(_.bind(function() {
    this.contentView.scrollbar.update();
    var currentPanel = this.panelViews[this.readerCtrl.state.panel];
    if (currentPanel && currentPanel.hasScrollbar()) {
      currentPanel.scrollbar.update();
    }
  }, this), 1) );

};

ReaderView.Prototype = function() {

  // Rendering
  // --------
  //

  this.render = function() {
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

    var medialStrip = $$('.medial-strip');
    medialStrip.appendChild($$('.separator-line'));
    medialStrip.appendChild(panelToggles);
    frag.appendChild(medialStrip);

    // Prepare panel views
    // -------

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

    // TODO: also update the outline after image (et al.) are loaded

    // Postpone things that expect this view has been inserted into the DOM already.
    _.delay(_.bind( function() {
      // initial state update here as scrollTo would not work out of DOM
      this.updateState();

      var self = this;
      // MathJax requires the processed elements to be in the DOM
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      window.MathJax.Hub.Queue(function () {
        console.log('Updating after MathJax has finished.');
        // HACK: using updateState() instead of updateScrollbars() as it also knows how to scroll
        self.updateState();
      });
    }, this), 1);

    return this;
  };

  // Free the memory.
  // --------
  //

  this.dispose = function() {
    _.each(this.workflows, function(workflow) {
      workflow.detach();
    });

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

  this.updateState = function() {
    var state = this.readerCtrl.state;

    var handled;

    // EXPERIMENTAL: introducing workflows to handle state updates
    // we extract some info to make it easier for workflows to detect if they
    // need to handle the state update.
    var stateInfo = {
      focussedNode: state.focussedNode ? this.doc.get(state.focussedNode) : null
    };
    var currentPanelView = state.panel === "content" ? this.contentView : this.panelViews[state.panel];

    _.each(this.panelViews, function(panelView) {
      panelView.hide();
    });
    // Always deactivate previous highlights
    this.contentView.removeHighlights();
    // and also rmove highlights from resource panels
    _.each(this.panelViews, function(panelView) {
      panelView.removeHighlights();
    });

    // Highlight the focussed node
    if (state.focussedNode) {
      currentPanelView.addHighlight(state.focussedNode, "focussed highlighted");
      currentPanelView.scrollTo(state.focussedNode);
    }

    // A workflow needs to take care of
    // 1. showing the correct panel
    // 2. setting highlights in the content panel
    // 3. setting highlights in the resource panel
    // 4. scroll panels
    // A workflow should have Workflow.handlesStateUpdates = true if it is interested in state updates
    // and should override Workflow.handleStateUpdate(state, info) to perform the update.
    // In case it has been responsible for the update it should return 'true'.

    if (!handled) {
      // Go through all workflows and let them try to handle the state update.
      // Stop after the first hit.
      for (var i = 0; i < this.readerCtrl.workflows.length; i++) {
        var workflow = this.readerCtrl.workflows[i];
        // lastWorkflow had its chance already, so skip it here
        if (workflow !== this.lastWorkflow && workflow.handlesStateUpdate) {
          handled = workflow.handleStateUpdate(state, stateInfo);
          if (handled) {
            break;
          }
        }
      }
    }

    // If not handled above, we at least show the correct panel
    if (!handled) {
      // Default implementation for states with a panel set
      if (state.panel !== "content") {
        this.showPanel(state.panel);
        // if there is a resource focussed in the panel, activate the resource, and highlight all references to it in the content panel
        if (state.focussedNode) {
          // get all references that point to the focussedNode and highlight them
          var refs = this.resources.get(state.focussedNode);
          _.each(refs, function(ref) {
            this.contentView.addHighlight(ref.id, "highlighted ");
          }, this);
        }
      } else {
        this.showPanel("toc");
      }
    }
  };

  this.updateScrollbars = function() {
    var state = this.readerCtrl.state;
    var currentPanelView = state.panel === "content" ? this.contentView : this.panelViews[state.panel];
    this.contentView.scrollbar.update();
    if (currentPanelView && currentPanelView.hasScrollbar()) currentPanelView.scrollbar.update();
  };

  this.showPanel = function(name) {
    if (this.panelViews[name]) {
      this.panelViews[name].activate();
      this.el.dataset.context = name;
    } else if (name === "content") {
      this.panelViews.toc.activate();
      this.el.dataset.context = name;
    }
  };

  // Based on the current application state, highlight the current resource
  // -------
  //
  // Triggered by updateState

  // this.updateResource = function() {
  //   var state = this.readerCtrl.state;
  //   this.contentView.deactivateActiveAnnotations();
  //   if (state.right) {
  //     var resourcePanel = this.panelViews[state.panel];
  //     resourcePanel.activateResource(state.right, state.fullscreen);
  //     this.contentView.markReferencesTo(state.right);
  //   } else {
  //     this.recoverScroll();
  //     // Hide all resources (see above)
  //   }
  //   this.updateOutline();
  // };

  // Whenever the app state changes
  // --------
  //
  // Triggered by updateResource.

  // this.updateOutline = function() {
  //   var state = this.getState();
  //   this.contentView.updateOutline({
  //     selectedNode: state.left,
  //     highlightClass: state.panel,
  //     target: state.right
  //   });
  //   var panelView = this.panelViews[state.panel];
  //   if(panelView.hasOutline) panelView.updateOutline({
  //     selectedNode: state.left,
  //     highlightClass: state.panel,
  //     highlightedNodes: [state.right]
  //   });
  // };

  this.getPanelView = function(name) {
    return this.panelViews[name];
  };

  // this.jumpToResource = function(resourceId) {
  //   var state =  this.getState();
  //   var panelView = this.panelViews[state.panel];
  //   panelView.jumpToResource(resourceId);
  // };

  // Toggles on and off the zoom
  // --------
  //
  // Note: this is called via event delegator
  // which is declared via sbs-click in node views (see resource_view)
  // TODO: is there a way to make this mechanism more transparent?

  // this.toggleFullscreen = function(resourceId) {
  //   var state = this.readerCtrl.state;
  //   // Always activate the resource
  //   this.readerCtrl.modifyState({
  //     focussedNode: resourceId,
  //     fullscreen: !state.fullscreen
  //   });
  // };

  // Toggle on-off a resource
  // --------
  //

  this.onToggleResource = function(panel, id) {
    var state = this.readerCtrl.state;
    // Toggle off if already on
    if (state.panel === panel && state.focussedNode === id) {
      id = null;
      panel = state.panel;
    }
    this.readerCtrl.modifyState({
      panel: panel || "toc",
      focussedNode: id,
      fullscreen: false
    });
  };

};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;
