var _ = require('underscore');

var Application = require("substance-application");
var $$ = Application.$$;
var View = Application.View;

var PanelView = function(panelController, config) {
  View.call(this);

  this.controller = panelController;
  this.config = config;
  this.doc = panelController.getDocument();

  this.name = config.name;

  this.toggleEl = $$('a.context-toggle.' + this.name, {
    'title': this.config.title,
    'html': '<i class="' + this.config.icon + '"></i><div class="label">'+this.config.label+'</div><span> '+this.config.label+'</span>'
  });
  this.$toggleEl = $(this.toggleEl);

  this.$el.addClass('panel').addClass(this.name);

  // For legacy add 'resource-view' class
  if (this.config.type === 'resource') {
    this.$el.addClass('resource-view');
  }

  this._onToggle = _.bind( this.onToggle, this );
  this.$toggleEl.click( this._onToggle );

  // we always keep track of nodes that have are highlighted ('active', 'focussed')
  this.highlightedNodes = [];
};

PanelView.Prototype = function() {

  this.dispose = function() {
    this.$toggleEl.off('click', this._onClick);
    this.$el.off('scroll', this._onScroll);
    this.stopListening();
  };

  this.onToggle = function() {
    this.trigger('toggle', this.name);
  };

  this.getToggleControl = function() {
    return this.toggleEl;
  };

  this.scrollTo = function(nodeId) {

  };

  this.jumpToResource = function(nodeId) {
    // A panel with a scrollable element should implement this method (e.g., see ContainerPanelView)
  };

  this.hasScrollbar = function() {
    return false;
  };

  this.show = function() {
    this.$el.removeClass('hidden');
  };

  this.hide = function() {
    this.$el.addClass('hidden');
    this.$toggleEl.removeClass('active');
  };

  this.activate = function() {
    this.show();
    this.$toggleEl.addClass('active');
  };

  this.addHighlight = function(id, cssClass) {
    // console.log("Add highlight for", id, cssClass);
    var nodeEl = this.findNodeView(id);
    if (nodeEl) {
      var $nodeEl = $(nodeEl);
      $nodeEl.addClass(cssClass);
      this.highlightedNodes.push({
        $el: $nodeEl,
        cssClass: cssClass
      });
    }
  };

  this.removeHighlights = function() {
    // console.log("Removing highlights from panel ", this.name);
    for (var i = 0; i < this.highlightedNodes.length; i++) {
      var highlighted = this.highlightedNodes[i];
      highlighted.$el.removeClass(highlighted.cssClass);
    }
    this.highlightedNodes = [];
  };

  this.showToggle = function() {
    this.$toggleEl.removeClass('hidden');
  };

  this.hideToggle = function() {
    this.$toggleEl.addClass('hidden');
  };

  this.getDocument = function() {
    return this.doc;
  };

  this.findNodeView = function(nodeId) {
    return this.el.querySelector('*[data-id='+nodeId+']');
  };

};

PanelView.Prototype.prototype = View.prototype;
PanelView.prototype = new PanelView.Prototype();
PanelView.prototype.constructor = PanelView;

module.exports = PanelView;
