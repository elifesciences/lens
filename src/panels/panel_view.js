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
    'html': '<i class="' + this.config.icon + '"></i><span> '+this.config.label+'</span>'
  });
  this.$toggleEl = $(this.toggleEl);

  this.$el.addClass('panel').addClass(this.name);

  // For legacy add 'resource-view' class
  if (this.config.type === 'resource') {
    this.$el.addClass('resource-view');
  }

  this._onToggle = _.bind( this.onToggle, this );
  this.$toggleEl.click( this._onToggle );
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

  // Jump to the given resource id
  // --------
  //

  this.jumpToResource = function(nodeId) {
    // A panel with a scrollable element should implement this method (e.g., see ContainerPanelView)
  };

  this.hasOutline = function() {
    return false;
  };

  this.updateOutline = function() {
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
  }

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
