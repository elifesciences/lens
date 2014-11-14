"use strict";

var _ = require("underscore");
var Scrollbar = require("./surface_scrollbar");

var Surface = require("../lens_surface");
var PanelView = require("./panel_view");

// TODO: try to get rid of DocumentController and use the Container node instead
var ContainerPanelView = function( panelCtrl, viewFactory, config ) {
  PanelView.call(this, panelCtrl, config);

  this.surface = new Surface( panelCtrl.docCtrl, {
    editable: false,
    viewFactory: viewFactory
  });
  this.docCtrl = panelCtrl.docCtrl;

  this.scrollbar = new Scrollbar(this.surface);

  this._onScroll = _.bind(this.onScroll, this);
  this.surface.$el.on('scroll', this._onScroll );

  this.surface.$el.addClass('resource-view').addClass(config.container);

  this.el.appendChild(this.surface.el);
  this.el.appendChild(this.scrollbar.el);

  this.$activeResource = null;
  this.lastScrollPos = 0;
};

ContainerPanelView.Prototype = function() {

  this.render = function() {
    // Hide the whole tab if there is no content
    if (this.getContainer().getLength() === 0) {
      this.hideToggle();
      this.hide();
    } else {
      this.surface.render();
      this.scrollbar.render();
    }
    return this;
  };

  this.getContainer = function() {
    return this.docCtrl.container;
  };

  this.onScroll = function() {
    this.scrollbar.onScroll();
  };

  this.hasScrollbar = function() {
    return true;
  };

  this.scrollTo = function(nodeId) {
    var n = this.findNodeView(nodeId);
    if (n) {
      console.log("Scrolling to node", nodeId);
      var $n = $(n);
      var scrollTop = this.surface.$el.scrollTop();
      var panelHeight = this.surface.$el.height();
      var elTop = $n.offset().top;
      var elHeight = $n.height();
      var topOffset;

      if (this.name === "citations") console.log("#### elTop=%s, scrollTop=%s", elTop, scrollTop);

      // Do not scroll if the element is fully visible
      if (elTop > 0 && elTop + elHeight < panelHeight) {
        if (this.name === "citations") console.log("... No need to scroll", elTop, scrollTop);
        // everything fine the
        return;
      }

      // If possible scroll so that the element is centered vertically
      if ( elHeight < panelHeight ) {
        // Note: if you are wondering why the initial scroll is often not exact
        // this is currently because the first scrollTo is called while the element is not rendered fully (e.g., image or MathJax)
        // and the second scrollTo does not do anything because the element might still be visible
        // To solve that we would need to distinguish updates during initialization (e.g., before images or MathJax has finished)
        // and regular updates. However, this seems a bit too much for this rather weak requirement.
        topOffset = scrollTop + elTop - 0.5 * ( panelHeight - elHeight );
      }
      else if (elTop >= 0 && elTop < panelHeight) {
        // We tolerate that in favor of not jumping when something is visible already
        return;
      }
      // In all other cases scroll to the top of the element
      else {
        topOffset = scrollTop + elTop;
      }

      this.surface.$el.scrollTop(topOffset);
      // TODO: is it possible to detect this case and just do it in mobile?
      // Brute force for mobile
      $(document).scrollTop(topOffset);
      this.scrollbar.update();
    } else {
      console.log("PanelView.jumpToResource(): Unknown resource '%s'", nodeId);
    }
  };

  this.jumpToResource = function(nodeId) {
    this.scrollTo(nodeId);
  };

  this.findNodeView = function(nodeId) {
    return this.surface.findNodeView(nodeId);
  };

  this.addHighlight = function(id, classes) {
    PanelView.prototype.addHighlight.call(this, id, classes);
    var node = this.getDocument().get(id);
    this.scrollbar.addHighlight(id, classes + " " + node.type);
  };

  this.removeHighlights = function() {
    PanelView.prototype.removeHighlights.call(this);
    this.scrollbar.removeHighlights();
    this.scrollbar.update();
  };

  // call this after you finsihed adding/removing highlights
  this.update = function() {
    this.scrollbar.update();
  };

  this.hide = function() {
    this.lastScrollPos = this.surface.$el.scrollTop();
    PanelView.prototype.hide.call(this);
  }

  this.show = function() {
    this.surface.$el.scrollTop(this.lastScrollPos);
    this.scrollbar.update();
    this.$el.removeClass('hidden');
  };

  // Toggle on-off a resource
  // --------
  //
  // Note: this is called via event delegator
  // which is declared via sbs-click in node views (see resource_view)
  // TODO: is there a way to make this mechanism more transparent?

  this.toggleResource = function(id) {
    this.trigger("toggle-resource", this.name, id);
  };

};

ContainerPanelView.Prototype.prototype = PanelView.prototype;
ContainerPanelView.prototype = new ContainerPanelView.Prototype();
ContainerPanelView.prototype.constructor = ContainerPanelView;

module.exports = ContainerPanelView;
