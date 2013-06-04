(function(root) {

var Figures = Backbone.View.extend({
  events: {
    'click .figure img.thumbnail': '_enableZoom',
    'click .large-image-wrapper': '_disableZoom'
  },

  className: "figure view",

  initialize: function(contextType) {

  },

  // Zoom in
  // -------
  // 
  // TODO: Clean up a little bit
  
  _enableZoom: function(e) {
    var $img = $(e.currentTarget);
    var id = $img.attr('id');
    var node = this.model.document.nodes[_.nodeId(id.replace('image','node'))];

    var width = $img.width();
    var height = $img.height();

    var $wrapper = $('#node_'+_.htmlId(node)+' .large-image-wrapper');

    var offset = $img.offset();
    this.pos = {
      left: offset.left,
      right: $(window).width() - (offset.left + $img.width()),
      top: offset.top,
      bottom: $(window).height() - (offset.top + $img.height())
    };

    $wrapper.css(this.pos).show();
    _.delay(function() {
      // 
      $wrapper.css({
        top: 50,
        bottom: 0,
        left: 0,
        right: 0
      });
      _.delay(function() {
        $wrapper.find('.figure-info').show();
      }, 500);
    }, 10);

  },

  // Zoom out
  // -------
  // 

  _disableZoom: function(e) {
    var $el = $(e.currentTarget);
    $el.css(this.pos);
    $el.find('.figure-info').hide();
    _.delay(function() {
      $el.hide();
    }, 400);
  },

  render: function() {
    var that = this;
    var html = new Lens.Renderer(this.model.document, 'figures').render();
    $(this.el).html(html);
    return this;
  }
});

// Export
// --------

root.Lens.Figures = Figures;

})(this);