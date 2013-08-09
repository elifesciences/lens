(function(root) {

var Publications = Backbone.View.extend({
  events: {

  },

  className: "publication view",

  initialize: function(contextType) {

  },

  render: function() {
    var that = this;

    var html = new Lens.Renderer(this.model.document, 'publications').render();
    $(this.el).html(html);
    return this;
  }
});

// Export
// --------

root.Lens.Publications = Publications;

})(this);