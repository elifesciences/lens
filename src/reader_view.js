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
  // mapping to associate reference types to panels
  // NB, in Lens each resource type has one dedicated panel;
  // clicking on a reference opens this panel
  this.panelForRef = {};

  _.each(readerCtrl.panels, function(panel) {
    var name = panel.getName();
    var panelCtrl = readerCtrl.panelCtrls[name];
    this.panelViews[name] = panelCtrl.createView();
    _.each(panel.config.references, function(refType) {
      this.panelForRef[refType] = name;
    }, this);
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
  this.lastPanel = "toc";

  this.formulaWidths = {};

  // Events
  // --------
  //

  this._onTogglePanel = _.bind( this.switchPanel, this );

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);

  this.listenTo(this.tocView,'toggle', this._onTogglePanel);
  _.each(this.panelViews, function(panelView) {
    this.listenTo(panelView, "toggle", this._onTogglePanel);
    this.listenTo(panelView, "toggle-resource", this.onToggleResource);
    this.listenTo(panelView, "toggle-resource-reference", this.onToggleResourceReference);
    this.listenTo(panelView, "toggle-fullscreen", this.onToggleFullscreen);
  }, this);
  // TODO: treat content panel as panelView and delegate to tocView where necessary
  this.listenTo(this.contentView, "toggle", this._onTogglePanel);
  this.listenTo(this.contentView, "toggle-resource", this.onToggleResource);
  this.listenTo(this.contentView, "toggle-resource-reference", this.onToggleResourceReference);
  this.listenTo(this.contentView, "toggle-fullscreen", this.onToggleFullscreen);

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
    this.detectRenderMode();
    this.fitFormulas();

  }, this), 1) );

};

ReaderView.Prototype = function() {

  // Mobile or desktop?
  this.detectRenderMode = function() {
    if ($(window).width()<=850) {
      this.renderMode = "mobile";
    } else {
      this.renderMode = "desktop";
    }
  };

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

        if (self.fitFormulas) {
          self.fitFormulas();
        }
      });
    }, this), 1);

    this.detectRenderMode();

    return this;
  };

  this.fitFormulas = function() {
    var self = this;

    // MathJax_Display
    $('.content-node.formula').each(function() {
      var nodeId = $(this).find('.MathJax_Display .MathJax').attr("id");

      var mathjaxContainer = $(this).find('.MathJax_Display')[0];
      var containerWidth = $(mathjaxContainer).width();

      var INDENT = 3.0;
      
      if (!self.formulaWidths[nodeId]) {
        var spanElement = $(mathjaxContainer).find(".math")[0];
        var style = window.getComputedStyle(spanElement);

        self.formulaWidths[nodeId] = parseFloat(style.fontSize) * (spanElement.bbox.w + INDENT);
        // console.log("content width for ", nodeId, self.formulaWidths[nodeId]);
      }

      var CORRECTION_FACTOR = 0.92;
      var ratio = Math.min(containerWidth / self.formulaWidths[nodeId]*CORRECTION_FACTOR,1.0);

      var mathEl = $(this).find('.math')[0];
      mathEl.style.transformOrigin = "top left";
      mathEl.style.transform = "scale("+ratio+")";
    });
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

  // Explicit panel switch
  // --------
  //
  // Only triggered by the explicit switch
  // Implicit panel switches happen when someone clicks a figure reference

  this.switchPanel = function(panel) {
    this.readerCtrl.switchPanel(panel);
    // keep this so that it gets opened when leaving another panel (toggling reference)
    this.lastPanel = panel;
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
      if (!panelView.isHidden()) panelView.hide();
    });

    // Always deactivate previous highlights
    this.contentView.removeHighlights();
    // and also rmove highlights from resource panels
    _.each(this.panelViews, function(panelView) {
      panelView.removeHighlights();
    });

    // Highlight the focussed node
    if (state.focussedNode) {
      var classes = ["focussed", "highlighted"];
      // HACK: abusing addHighlight for adding the fullscreen class
      // instead I would prefer to handle such focussing explicitely in a workflow
      if (state.fullscreen) classes.push("fullscreen");
      currentPanelView.addHighlight(state.focussedNode, classes.join(' '));
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

    if (this.lastWorkflow) {
      handled = this.lastWorkflow.handleStateUpdate(state, stateInfo);
    }

    if (!handled) {
      // Go through all workflows and let them try to handle the state update.
      // Stop after the first hit.
      for (var i = 0; i < this.readerCtrl.workflows.length; i++) {
        var workflow = this.readerCtrl.workflows[i];
        // lastWorkflow had its chance already, so skip it here
        if (workflow !== this.lastWorkflow && workflow.handlesStateUpdate) {
          handled = workflow.handleStateUpdate(state, stateInfo);
          if (handled) {
            this.lastWorkflow = workflow;
            break;
          }
        }
      }
    }

    // If not handled above, we at least show the correct panel
    if (!handled) {
      // Default implementation for states with a panel set
      if (state.panel !== "content") {
        var panelView = this.panelViews[state.panel];
        this.showPanel(state.panel);
        // if there is a resource focussed in the panel, activate the resource, and highlight all references to it in the content panel
        if (state.focussedNode) {
          // get all references that point to the focussedNode and highlight them
          var refs = this.resources.get(state.focussedNode);
          _.each(refs, function(ref) {
            this.contentView.addHighlight(ref.id, "highlighted ");
          }, this);
          if (panelView.hasScrollbar()) panelView.scrollTo(state.focussedNode);
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

  this.getPanelView = function(name) {
    return this.panelViews[name];
  };

  // Toggle (off) a resource
  // --------
  //

  this.onToggleResource = function(panel, id, element) {
    console.log("ReaderView.onToggleResource", panel, id, element);
    if (element.classList.contains('highlighted')) {
      this.readerCtrl.modifyState({
        panel: this.lastPanel,
        focussedNode: null,
        fullscreen: false
      });
    } else {
      this.readerCtrl.modifyState({
        panel: panel,
        focussedNode: id
      });
    }
  };

  // Toggle (off) a reference
  // --------

  this.onToggleResourceReference = function(panel, id, element) {
    if (element.classList.contains('highlighted')) {
      this.readerCtrl.modifyState({
        panel: this.lastPanel,
        focussedNode: null,
        fullscreen: false
      });
    } else {
      // FIXME: ATM the state always assumes 'content' as the containing panel
      // Instead, we also let the panel catch the event and then delegate to ReaderView providing the context as done with onToggleResource
      this.readerCtrl.modifyState({
        panel: "content",
        focussedNode: id,
        fullscreen: false
      });
    }
  };

  this.onToggleFullscreen = function(panel, id) {
    var fullscreen = !this.readerCtrl.state.fullscreen;
    this.readerCtrl.modifyState({
      panel: panel,
      focussedNode: id,
      fullscreen: fullscreen
    });
  };

};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;
