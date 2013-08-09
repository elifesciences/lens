(function(root) {

var Info = Backbone.View.extend({
  events: {

  },

  className: "info view",
  
  initialize: function() {

  },

  render: function() {
    var html = new Lens.Renderer(this.model.document, 'info').render();

    $(this.el).html(_.tpl('document_info', {
      content: html
    }));
    return this;
  }
});

// Export
// --------

root.Lens.Info = Info;

})(this);