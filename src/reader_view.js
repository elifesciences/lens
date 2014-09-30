"use strict";

var _ = require("underscore");
var Outline = require("lens-outline");
var View = require("substance-application").View;
var Data = require("substance-data");
var Index = Data.Graph.Index;
var $$ = require("substance-application").$$;

var CORRECTION = 0; // Extra offset from the top

// Renders the reader view
// --------
//
// .document
// .context-toggles
//   .toggle-toc
//   .toggle-figures
//   .toggle-citations
//   .toggle-info
// .resources
//   .toc
//   .surface.figures
//   .surface.citations
//   .info

var Renderer = function(reader) {

  var frag = document.createDocumentFragment();

  // Prepare doc view
  // --------

  var docViewEl = $$('.document');
  docViewEl.appendChild(reader.contentView.render().el);

  // Prepare context toggles
  // --------

  var children = [];

  var panelFactory = reader.panelFactory;
  _.each(panelFactory.getNames(), function(name) {
    if (name === 'content') return;
    if (reader.panelViews[name]) {
      var spec = panelFactory.getSpec(name);

      // Don't show TOC when there are not enough headings
      if (name === "toc" && reader.doc.getHeadings().length < 2) return;

      children.push($$('a.context-toggle.' + name, {
        'href': '#',
        'sbs-click': 'switchContext('+name+')',
        'title': spec.title,
        'html': '<i class="' + spec.icon + '"></i><span> '+spec.label+'</span><div class="label">'+spec.label+'</div>'
      }));
    }
  });


  var contextToggles = $$('.context-toggles', {
    children: children
  });

  // Prepare resources view
  // --------

  var medialStrip = $$('.medial-strip');

  var collection = reader.readerCtrl.options.collection;
  if (collection) {
    medialStrip.appendChild($$('a.back-nav', {
      'href': collection.url,
      'title': 'Go back',
      'html': '<i class=" icon-chevron-up"></i>'
    }));
  }

  medialStrip.appendChild($$('.separator-line'));
  medialStrip.appendChild(contextToggles);

  frag.appendChild(medialStrip);

  // Wrap everything within resources view
  var resourcesViewEl = $$('.resources');

  // resourcesView.appendChild(medialStrip);

  _.each(panelFactory.getNames(), function(name) {
    if (name === 'content') return;
    if (reader.panelViews[name]) {
      resourcesViewEl.appendChild(reader.panelViews[name].render().el);
    }
  });

  frag.appendChild(docViewEl);
  frag.appendChild(resourcesViewEl);
  return frag;
};


// Lens.Reader.View
// ==========================================================================
//

var ReaderView = function(readerCtrl) {
  View.call(this);

  // Controllers
  // --------

  this.readerCtrl = readerCtrl;
  this.panelFactory = readerCtrl.panelFactory;

  var doc = this.readerCtrl.contentCtrl.__document;
  this.doc = doc;

  this.$el.addClass('article');
  this.$el.addClass(doc.schema.id); // Substance article or lens article?

  // Stores latest body scroll positions per context
  // Only relevant
  this.bodyScroll = {};

  // Surfaces
  // --------
  var panelFactory = readerCtrl.panelFactory;

  // A Substance.Document.Writer instance is provided by the controller
  this.contentView = panelFactory.createPanelView('content', readerCtrl.contentCtrl);

  // Panels
  // ------
  this.panelViews = {};
  _.each(panelFactory.getNames(), function(name) {
    if (name === 'content') return;
    var spec = panelFactory.getSpec(name);
    if (spec.shouldBeVisible(name, doc)) {
      var panelView;
      if (name === 'toc') {
        panelView = panelFactory.createPanelView('toc', readerCtrl.contentCtrl);
      } else if (readerCtrl.panelCtrls[name]) {
        panelView = panelFactory.createPanelView(name, readerCtrl.panelCtrls[name]);
      }
      if (panelView) this.panelViews[name] = panelView;
    }
  }, this);

  this.tocView = this.panelViews.toc;

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);

  // Keep an index for resources
  this.resources = new Index(this.readerCtrl.__document, {
    types: ["resource_reference"],
    property: "target"
  });

  // Outline
  // --------

  this.outline = new Outline(this.contentView);


  // Resource Outline
  // --------

  this.resourcesOutline = new Outline(this.figuresView);

  // DOM Events
  // --------
  //

  this.contentView.$el.on('scroll', _.bind(this.onContentScroll, this));

  // handle scrolling in resource panels
  _.each(this.panelFactory.getNames(), function(name) {
    if (!this.panelViews[name]) return;

    var spec = this.panelFactory.getSpec(name);
    var panel = this.panelViews[name];
    panel.$el.on('scroll', _.bind(this.onResourceContentScroll, this));

    // Resource references
    //
    // attach click handler to open the right panel when clicking on
    // a reference in the content panel
    _.each(spec.references, function(refType) {
      this.$el.on('click', '.annotation.' + refType, _.bind(this.toggleResourceReference, this, spec.name));
    }, this);

  }, this);


  this.$el.on('click', '.annotation.cross_reference', _.bind(this.followCrossReference, this));

  // this.$el.on('click', '.document .content-node.heading', _.bind(this.setAnchor, this));

  this.$el.on('click', '.document .content-node.heading .top', _.bind(this.gotoTop, this));

  this.outline.$el.on('click', '.node', _.bind(this._jumpToNode, this));

};


ReaderView.Prototype = function() {

  this.setAnchor = function(e) {
    this.toggleNode('toc', $(e.currentTarget).attr('id'));
  };

  this.gotoTop = function() {
    // Jump to cover node as that's easiest
    this.jumpToNode("cover");
    $(document).scrollTop(0);
    return false;
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

  this._jumpToNode = function(e) {
    var nodeId = $(e.currentTarget).attr('id').replace("outline_", "");
    this.jumpToNode(nodeId);
    return false;
  };

  // Toggle Resource Reference
  // --------
  //

  this.toggleResourceReference = function(context, e) {
    var state = this.readerCtrl.state;
    var aid = $(e.currentTarget).attr('id');
    var a = this.readerCtrl.__document.get(aid);

    var nodeId = this.readerCtrl.contentCtrl.container.getRoot(a.path[0]);
    var resourceId = a.target;

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

      this.jumpToResource(resourceId);
    }

    e.preventDefault();
  };

  // Follow cross reference
  // --------
  //

  this.followCrossReference = function(e) {
    var aid = $(e.currentTarget).attr('id');
    var a = this.readerCtrl.__document.get(aid);
    this.jumpToNode(a.target);
  };


  // On Scroll update outline and mark active heading
  // --------
  //

  this.onContentScroll = function() {
    var scrollTop = this.contentView.$el.scrollTop();
    this.outline.updateVisibleArea(scrollTop);
    this.markActiveHeading(scrollTop);
  };

  this.onResourceContentScroll = function() {
    // Make sure that a surface is attached to the resources outline
    if (this.resourcesOutline.surface) {
      var scrollTop = this.resourcesOutline.surface.$el.scrollTop();
      this.resourcesOutline.updateVisibleArea(scrollTop);      
    }
  };


  // Mark active heading
  // --------
  //

  this.markActiveHeading = function(scrollTop) {
    var contentHeight = $('.nodes').height();

    var headings = this.doc.getHeadings();
    
    // No headings?
    if (headings.length === 0) return;

    // Use first heading as default
    var activeNode = _.first(headings).id;

    this.contentView.$('.content-node.heading').each(function() {
      if (scrollTop >= $(this).position().top + CORRECTION) {
        activeNode = this.id;
      }
    });

    // Edge case: select last item (once we reach the end of the doc)
    if (scrollTop + this.contentView.$el.height() >= contentHeight) {
      activeNode = _.last(headings).id;
    }
    this.tocView.setActiveNode(activeNode);
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

  // Jump to the given node id
  // --------
  //

  this.jumpToNode = function(nodeId) {
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top+CORRECTION;
      this.contentView.$el.scrollTop(topOffset);
    }
  };

  // Jump to the given resource id
  // --------
  //

  this.jumpToResource = function(nodeId) {
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top;

      // TODO: Brute force for now
      // Make sure to find out which resource view is currently active
      var panelView = this.panelViews[this.readerCtrl.state.context];
      if (panelView) panelView.$el.scrollTop(topOffset);

      // Brute force for mobile
      $(document).scrollTop(topOffset);
    }
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
    var targetScroll = this.bodyScroll[this.readerCtrl.state.context];

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
    this.bodyScroll[this.readerCtrl.state.context] = this.getScroll();
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

    // Set context on the reader view
    // -------

    // TODO: we should have collected all resource types at this point
    this.$el.removeClass('toc figures citations info definitions');
    this.contentView.$('.content-node.active').removeClass('active');
    this.$el.addClass(state.context);

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

      // Update outline
    } else {
      this.recoverScroll();
      // Hide all resources (see above)
    }

    this.updateOutline();
  };

  // Returns true when on a mobile device
  // --------

  this.isMobile = function() {

  };

  // Whenever the app state changes
  // --------
  //
  // Triggered by updateResource.

  this.updateOutline = function() {
    var that = this;
    var state = this.readerCtrl.state;
    var nodes = this.getResourceReferenceContainers();

    that.outline.update({
      context: state.context,
      selectedNode: state.node,
      highlightedNodes: nodes
    });


    // Resources outline
    // -------------------

    if (state.context === "toc") {
      $(that.resourcesOutline.el).addClass('hidden');
      return;
    } else if (this.panelViews[state.context]) {
      that.resourcesOutline.surface = this.panelViews[state.context];
    } else {
      that.resourcesOutline.surface = this.panelViews['info'];
    }

    $(that.resourcesOutline.el).removeClass('hidden');

    that.resourcesOutline.update({
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

  // Rendering
  // --------
  //

  this.render = function() {
    var that = this;

    var state = this.readerCtrl.state;
    this.el.appendChild(new Renderer(this));

    // After rendering make reader reflect the app state
    this.$('.document').append(that.outline.el);

    this.$('.resources').append(that.resourcesOutline.el);

    // Await next UI tick to update layout and outline
    _.delay(function() {
      // Render outline that sticks on this.surface
      that.updateState();
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
    }, 1);

    // Wait for stuff to be rendered (e.g. formulas)
    // TODO: use a handler? MathJax.Hub.Queue(fn) does not work for some reason

    _.delay(function() {
      that.updateOutline();
    }, 2000);

    var lazyOutline = _.debounce(function() {
      that.updateOutline();
    }, 1);

    // Jump marks for teh win
    if (state.node) {
      _.delay(function() {
        that.jumpToNode(state.node);
        if (state.resource) {
          that.jumpToResource(state.resource);
        }
      }, 100);
    }

    $(window).resize(lazyOutline);

    return this;
  };


  // Free the memory.
  // --------
  //

  this.dispose = function() {
    this.contentView.dispose();
    if (this.figuresView) this.figuresView.dispose();
    if (this.citationsView) this.citationsView.dispose();
    if (this.infoView) this.infoView.dispose();
    this.resources.dispose();

    this.stopListening();
  };
};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;
