var _ = require('underscore');

var Application = require("../../substance/application");
var $$ = Application.$$;
var View = Application.View;

var PanelView = function(panelController, config) {
  View.call(this);

  this.controller = panelController;
  this.config = config;
  this.doc = panelController.getDocument();
  this.name = config.name;

  this.toggleEl = $$('a.context-toggle.' + this.name, {
    'href': '#',
    'title': this.config.title,
    'html': '<i class="fa ' + this.config.icon + '"></i> '+this.config.title
  });
  this.$toggleEl = $(this.toggleEl);

  this.$el.addClass('panel').addClass(this.name);

  // For legacy add 'resource-view' class
  if (this.config.type === 'resource') {
    this.$el.addClass('resource-view');
  }

  // Events

  this._onToggle = _.bind( this.onToggle, this );
  this._onToggleResource = _.bind( this.onToggleResource, this );
  this._onToggleResourceReference = _.bind( this.onToggleResourceReference, this );
  this._onToggleFullscreen = _.bind( this.onToggleFullscreen, this);

  this.$toggleEl.click( this._onToggle );
  this.$el.on('click', '.action-toggle-resource', this._onToggleResource);
  this.$el.on('click', '.toggle-fullscreen', this._onToggleFullscreen);
  this.$el.on('click', '.annotation.resource-reference', this._onToggleResourceReference);

  // we always keep track of nodes that have are highlighted ('active', 'focussed')
  this.highlightedNodes = [];
};

PanelView.Prototype = function() {

  this.dispose = function() {
    this.$toggleEl.off('click', this._onClick);
    this.$el.off('scroll', this._onScroll);
    this.$el.off('click', '.a.action-toggle-resource', this._onToggleResource);
    this.$el.off('click', '.a.toggle-fullscreen', this._onToggleFullscreen);
    this.$el.off('click', '.annotation.reference', this._onToggleResourceReference);
    this.stopListening();
  };

  this.onToggle = function(e) {
    this.trigger('toggle', this.name);
    e.preventDefault();
    e.stopPropagation();
  };

  this.getToggleControl = function() {
    return this.toggleEl;
  };

  this.hasScrollbar = function() {
    return false;
  };

  this.show = function() {
    this.$el.removeClass('hidden');
    this.hidden = false;
  };

  this.hide = function() {
    if (this.hidden) return;
    this.$el.addClass('hidden');
    this.$toggleEl.removeClass('active');
    this.hidden = true;
  };

  this.isHidden = function() {
    return this.hidden;
  };

  this.activate = function() {
    this.show();
    $('#main .article')[0].dataset.context = this.name;
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


  // Event handling
  // --------
  //

  this.onToggleResource = function(event) {
    event.preventDefault();
    event.stopPropagation();
    var element = $(event.currentTarget).parents('.content-node')[0];
    var id = element.dataset.id;
    this.trigger("toggle-resource", this.name, id, element);
  };

  this.onToggleResourceReference = function(event) {
    event.preventDefault();
    event.stopPropagation();
    var element = event.currentTarget;
    var refId = event.currentTarget.dataset.id;
    this.trigger("toggle-resource-reference", this.name, refId, element);
  };

  this.onToggleFullscreen = function(event) {
    event.preventDefault();
    event.stopPropagation();
    var element = $(event.currentTarget).parents('.content-node')[0];
    var id = element.dataset.id;
    this.trigger("toggle-fullscreen", this.name, id, element);
  };

};

PanelView.Prototype.prototype = View.prototype;
PanelView.prototype = new PanelView.Prototype();
PanelView.prototype.constructor = PanelView;

module.exports = PanelView;
