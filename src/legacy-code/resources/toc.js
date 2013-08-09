(function(root) {

var TOC = Backbone.View.extend({
  events: {

  },

  className: "toc view",

  initialize: function(contextType) {

  },

  render: function() {
    $(this.el).html(_.tpl('toc', {
      headings: getHeadings(this.model.document)
    }));
    return this;
  }
});

// Export
// --------

root.Lens.TOC = TOC;

})(this);