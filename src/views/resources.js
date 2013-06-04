(function(root) {

// Resources Panel that sits on the right
// -----------------

var Resources = Backbone.View.extend({
  events: {
    
  },

  // Show resource type
  // --------
  // 
  // Changes the viewing mode of the resources panel

  showType: function(type) {
    var headingCount = getHeadings(this.model.document).length;
    var figureCount = this.model.document.views.figures.length;
    var publicationCount = this.model.document.views.publications.length;

    if (headingCount < 2) {
      // hide headings tab
      _.delay(function() {
        $('.resource-type.toc').hide();
      }, 20);
      
      if (figureCount>0) {
        if (type === 'toc') type = 'figure';
      } else if (publicationCount > 0) {
        if (type === 'toc') type = 'publication';
      } else {
        if (type === 'toc') type = 'info';
      }
    }

    this.$('.resource-types').removeClass('figure')
                             .removeClass('publication')
                             .removeClass('toc')
                             .removeClass('info')
                             .addClass(type);

    this.$('.content-wrapper .view').hide();
    this.$('.view.'+type).show();

    this.model.resourceType = type;
  },


  // Constructor
  // --------
  // 

  initialize: function() {

  },

  // For a given type name, return the corresponding JS class name
  // --------
  // 

  getClass: function(type) {
    var mappings = {
      "figure": "Figures",
      "publication": "Publications",
      "text": "Texts"
    };
    return mappings[type];
  },

  // Scroll to a given resource
  // --------
  // 

  jumpToResource: function(resource) {
    if (!resource) return;
    var $n = this.$('#node_'+_.htmlId(resource.id));
    if ($n.length > 0) $('#document .content-wrapper').scrollTop($n.position().top);      
  },

  // Update Resources based on viewing context
  // --------
  // 

  update: function(silent) {
    var doc = this.model.document;
    var that = this;
    var node = doc.nodes[this.model.node];
    var resource = doc.nodes[this.model.resource];
    var type = this.model.resourceType;

    if (node) {
      var resources = {
        "figure": _.map(this.model.document.find('figure_references', node.id), function(n) {
          return doc.nodes[n.target];
        }),
        "publication": _.map(this.model.document.find('publication_references', node.id), function(n) {
          return doc.nodes[n.target];
        })
      };
    } else {
      var resources = {
        "figure": this.model.document.traverse('figures'),
        "publication": this.model.document.traverse('publications')
      };
    }

    // Uniq, and compact
    resources.figure = _.uniq(_.compact(resources.figure));
    resources.publication = _.uniq(_.compact(resources.publication));

    $('.content-wrapper .active').removeClass('active');

    if (_.include(["figure", "publication"], type)) {
      // Hide all resources not associated with with current node
      this.$('.content-node').hide();
      _.each(resources[type], function(res) {
        this.$('#node_'+_.htmlId(res.id)).show();
      }, this);

      if (resources[type].length === 0) {
        this.$('.content-node').show();
      }

      // Update label
      var totalCount = this.$('.'+type+'s-view .content-node').length;
      var count = resources[type].length;
      if (count === totalCount || count === 0) {
        this.$('.resources-header .text').html('Showing '+totalCount+ ' '+type+'s');
      } else {
        this.$('.resources-header .text').html('Showing '+count+' out of '+ totalCount+' '+type+'s - <a href="#" class="clear">Show all</a>');  
      }
    } else {
      // Show all content nodes (e.g. for info panel)
      this.$('.content-node').show();
      this.$('.resources-header .text').empty();
    }
    
    // Toggle resource type
    if (resource) {
      var $toggle = $('.toggle-resource[data-resource="'+_.htmlId(resource.id)+'"]');
      $toggle.addClass('active');
      var $n = this.$('#node_'+_.htmlId(resource.id));
      $n.addClass('active');
      if (!silent) {
        _.delay(function() {
          that.jumpToResource(resource);
        }, 10);
      }
    }

    // bring to front?
    this.showType(type);
  },

  // Render TOC Subview
  // --------
  // 

  renderTOC: function() {
    this.toc = new Lens.TOC({
      model: this.model
    });
    this.$('.content-wrapper').append(this.toc.render().el);
  },

  // Render Info Subview
  // --------
  // 

  renderInfo: function() {
    // Populate subview based on selected type
    this.info = new Lens.Info({
      model: this.model
    });

    this.$('.content-wrapper').append(this.info.render().el);
  },

  // Render Figures Subview
  // --------
  // 

  renderFigures: function() {
    // Populate subview based on selected type
    this.figures = new Lens.Figures({
      model: {
        "document": this.model.document,
      }
    });
    this.$('.content-wrapper').append(this.figures.render().el);
  },

  // Render Publications Subview
  // --------
  // 

  renderPublications: function() {
    this.publications = new Lens.Publications({
      model: {
        "document": this.model.document,
      }
    });

    this.$('.content-wrapper').append(this.publications.render().el);
  },

  // Render resources panel
  // --------
  // 
  // Injects all subviews

  render: function() {
    var that = this;
    $(this.el).html(_.tpl('resources', this.model));
    this.$('.content-wrapper').empty();

    this.renderTOC();
    this.renderInfo();
    this.renderPublications();
    this.renderFigures();
    this.update();

    return this;
  }
});

// Export
root.Lens.Resources = Resources;

})(this);
