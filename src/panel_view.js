
var _ = require('underscore');

var Application = require("substance-application");
var $$ = Application.$$;
var View = Application.View;

var Outline = require("lens-outline");

var PanelView = function( panel ) {
  View.call(this);

  var config = panel.getConfig();

  this.panel = panel;
  this.name = panel.getName();
  this.outline = new Outline(this);

  this.toggleEl = $$('a.context-toggle.' + this.name,
    {
      'href': '#',
      'title': config.title,
      'html': '<i class="' + config.icon + '"></i><span> '+config.label+'</span><div class="label">'+config.label+'</div>'
    } );
  this.$toggleEl = $(this.toggleEl);

  this._onClick = _.bind( this.onClick, this );
  this._onScroll = _.bind(this.onScroll, this);

  this.$toggleEl.click( this._onClick );
  this.$el.on('scroll', this._onScroll );
};

PanelView.Prototype = function() {

  this.dispose = function() {
    this.$toggleEl.off('click', this._onClick);
    this.$el.off('scroll', this._onScroll);
    this.stopListening();
  };

  this.onClick = function() {
    this.emit('toggle', this.name );
  };

  this.onScroll = function() {
    // Make sure that a surface is attached to the resources outline
    if (this.outline.surface) {
      var scrollTop = this.outline.surface.$el.scrollTop();
      this.outline.updateVisibleArea(scrollTop);
    }
  };

  this.getToggleControl = function() {
    return this.toggleEl;
  };

  // Jump to the given resource id
  // --------
  //

  this.jumpToResource = function(nodeId) {
    var $n = this.$el.find('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top;
      this.$el.scrollTop(topOffset);
      // TODO: is it possible to detect this case and just do it in mobile?
      // Brute force for mobile
      $(document).scrollTop(topOffset);
    }
  };

  this.updateOutline = function(options) {
    this.outline.update(options);
  };

};

PanelView.Prototype.prototype = View.prototype;
PanelView.prototype = new PanelView.Prototype();
PanelView.prototype.constructor = PanelView;

module.exports = PanelView;
