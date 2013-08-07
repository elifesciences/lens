(function(root) {

var CORRECTION = -100; // Extra offset from the top

// Lens.Document
// ========

var Document = Backbone.View.extend({

  // DOM Event handling
  // -----------------
  // 
  // Most events are handled globally on the document and dispatched
  // to subviews if necessary.

  events: {
    'click span.annotation': '_showAnnotation',
    'mouseover span.annotation': '_teaseAnnotation',
    'mouseout span.annotation': '_untease',
    'click .resource .resource-header': '_showResource',
    'click .authors .author': '_showAuthor',
    'click .document span.formula_reference': '_showFormula',
    'click .outline .node': '_switchNode',
    'click .heading-ref': '_jumpToHeading',
    'click .nodes .focus .focus-figures': '_toggleFocus',
    'click .nodes .focus .focus-publications': '_toggleFocus',
    'click .nodes .focus.anchor': '_toggleAnchor',
    'click .resources .clear': 'clear',
    'click .resource-type': '_switchType',
    'mousedown .outline': '_mouseDown',
    'mouseup': '_mouseUp',
    'mousemove .outline': '_scroll'
  },

  // Show Author Card
  // -----------------
  // 

  _showAuthor: function(e) {
    var person = $(e.currentTarget).attr('data-id');

    if (person === this.model.resource) {
      this.clear(this.model.activeResourceType);
    } else {
      this.showResource(person);
    }
    return false;
  },

  // Tease
  // -----------------
  // 
  // Visually tease annotation on mousover
  // TODO: We could start teasing the occurences here

  // _teaseAnnotation: function(e) {
  //   var doc = this.model.document;
  //   $el = $(e.currentTarget);
  //   var type = $el.hasClass('figure_reference') ? 'figures' : 'publications';
  //   var node = $(e.currentTarget).parent().attr('id');
  //   $('#'+node+' .focus-'+type).addClass('active');
  //   return false;
  // },

  // Untease
  // -----------------
  // 
  // On mouse out, remove the teased items

  // _untease: function() {
  //   $('.focus-publications').removeClass('active');
  //   $('.focus-figures').removeClass('active');
  //   return false;
  // },

  // Handle Mouse Down
  // -----------------
  // 
  // Used by the document map to scroll through the doc by
  // clicking and holding the `.visible-area` handle

  // _mouseDown: function(e) {
  //   this.mouseDown = true;
  //   var y = e.pageY;

  //   // find offset to visible-area.top
  //   this.offset = y - $('.visible-area').position().top;
  //   return false;
  // },

  // // Handle Mouse Up
  // // -----------------
  // // 
  // // Mouse lifted, no scroll anymore

  // _mouseUp: function() {
  //   this.mouseDown = false;
  // },

  // // Handle Scroll
  // // -----------------
  // // 
  // // Handle scroll event
  // // .visible-area handle

  // _scroll: function(e) {
  //   if (this.mouseDown) {
  //     var y = e.pageY;
  //     // find offset to visible-area.top
  //     var scroll = (y - this.offset)*this.factor;
  //     $('#container .content').scrollTop(scroll);
  //   }
  // },

  // TODO: Redundant, try to combine with toggleFocus
  _toggleAnchor: function(e) {
    var node = _.nodeId($(e.currentTarget).parent().attr('id'));
    
    if (node === this.model.node) {
      return this.clear(this.model.activeResourceType);
    } else {
      this.selectNode(node);  
    }
    
    this.model.resource = null;
    this.updateResources();
    this.updateOutline();
    this.updatePath();
    return false;
  },

  _toggleFocus: function(e) {
    var node = _.nodeId($(e.currentTarget).parent().parent().attr('id'));
    var type = $(e.currentTarget).attr('data-type');

    if (node === this.model.node && this.model.resourceType === type) {
      // Go back to previously selected resource Scope
      this.clear(this.model.activeResourceType);
    } else {
      this.selectNode(node, true);
    }

    this.model.resource = null;
    this.detectResource(this.model.node, type);

    this.updateResources();
    this.updateOutline();
    this.updatePath();
    return false;
  },

  _switchType: function(e) {
    var type = $(e.currentTarget).attr('data-type');

    var res = this.model.resource;
    this.clear(type);
    
    if (this.model.activeResourceType === type) {
      this.model.resource = res;
    } else {
      this.model.activeResourceType = type;  
    }
    
    this.updateResources();
    this.updatePath();
    return false;
  },

  // Handle clicks on `.formula` instances
  // --------
  // 

  _showFormula: function(e) {
    var id = $(e.currentTarget).attr('data-id');
    var annotation = this.model.document.nodes[id];
    this.jumpToNode(annotation.target);
    return false;
  },

  // Handle clicks on `.heading-ref` elements in the TOC
  // --------
  // 

  _jumpToHeading: function(e) {
    var target = $(e.currentTarget).attr('data-node');
    var node = this.model.document.nodes[target];
    this.selectNode(node.id);
    this.jumpToNode(node);
    this.updateResources();
    this.updatePath();
    return false;
  },

  // Navigate to content node
  // --------
  // 
  // Each time the user clicks on a node link in the document outline

  _switchNode: function(e) {
    var node = $(e.currentTarget).attr('id')
               .replace('outline_', '')
               .replace('node_', '')
               .replace(/_/g, ':');
    this.jumpToNode(node);
    return false;
  },

  // Follow an annotation reference
  // --------
  // 
  // Triggered when clicking on an annotation in the document

  selectNode: function(node, silent) {
    this.model.node = node;
    $('#document .content-node').removeClass('active');
    if (node) {
      $('#node_'+_.htmlId(node)).addClass('active');

      // Highlight toc entry
      var tocEntry = $('.resources .headings a[data-node="'+node+'"]');

      $('.resources .headings a.selected').removeClass('selected');
      tocEntry.addClass('selected');
    }
  },

  // Handle clicks on `.annotation` elements
  // --------
  // 
  // Triggered when clicking on an annotation in the document

  _showAnnotation: function(e) {
    var elem = $(e.currentTarget);
    var annotation = this.model.document.nodes[elem.attr('data-id')];

    if (elem.hasClass('active')) return this.clear(this.model.activeResourceType);
    if (annotation.source.indexOf('caption') === -1) {
      this.model.node = annotation.source;
    } else {
      this.model.node = null;
    }
    return this.showResource(annotation.target, false);
  },

  // Handle clicks on `.resource` elements
  // -------------
  // 

  _showResource: function(e) {

    var resource = _.nodeId($(e.currentTarget).parent().attr('id'));
    if (resource === this.model.resource) {
      this.model.resource = null;
      $('.authors .author').removeClass('active');
      this.updateResources();
    } else {
      this.showResource(resource, true);  
    }
  },

  // Constructor
  // -------------
  // 

  initialize: function(options) {
    key('esc', _.bind(function() {
      return this.clear(this.model.activeResourceType);
    }, this));
  },

  // Show given resource in the resources panel.
  // -------------
  // 

  showResource: function(resource, silent) {
    var doc = this.model.document;
    var resource = doc.nodes[resource];

    if (!resource) return;

    var parentType = doc.getTypes(resource.type)[0];

    if (!_.include(['figure', 'publication', 'person'], parentType)) return;
    if (this.model.node) this.selectNode(this.model.node, silent);

    if (parentType === 'person') {
      this.model.resourceType = 'info';
    } else {
      this.model.resourceType = parentType;  
    }
    
    this.model.resource = resource.id;
    this.updateResources(silent);
    this.updatePath();
    
    return false;
  },

  // Highlight Resource
  // -------------
  // 
  // Highlight all annotations for a particular resource (e.g. Figure)

  highlightResource: function() {
    var annotations = this.model.document.find('reverse_annotations', this.model.resource);
    this.$('span.annotation').removeClass('active');

    _.each(annotations, function(a) {
      this.$('span[data-id="'+a.id+'"]').addClass('active');
    }, this);
  },

  // Clear focus
  // -------------
  // 
  // Resets the current focus, can also be triggered by pressing ESC

  clear: function(resourceType) {
    this.model.node = null;
    this.model.resource = null;
    this.model.resourceType = resourceType && _.isString(resourceType) ? resourceType : 'toc';
    $('#document .content-node').removeClass('active');
    $('#document .annotation').removeClass('active');

    
    $('.resources .headings .heading-ref').removeClass('selected');
    $('#document .resources .content-node.active').removeClass('active');

    this.updateResources();
    this.updateOutline();
    this.updatePath();
    return false;
  },

  // Jump to node, given a node id
  // -------------

  jumpToNode: function(node) {
    var $n = $('#node_'+_.htmlId(node));
    
    if ($n.length > 0) {
      var topOffset = $n.position().top+CORRECTION;
      $('#container .content').scrollTop(topOffset);
    }
  },

  // Detect Resource
  // -------------
  // 
  // Find first ocurrence of annotation type (figref and pubref)

  detectResource: function(node, type) {
    // Find figures
    var figures = this.model.document.find('figure_references', node);
    var publications = this.model.document.find('publication_references', node);

    // Auto-select first resource
    if (type === "figure" && figures.length > 0) {
      this.model.resource = figures[0].target;
      this.model.resourceType = "figure";
    } else if (type === "publication" && publications.length > 0) {
      this.model.resource = publications[0].target;
      this.model.resourceType = "publication";
    }
  },

  // Update Resources
  // -------------
  // 
  // Gets called each time the viewing context changes
  // E.g. when the user selects a resource in the text

  updateResources: function(silent) {
    this.resources.update(silent);
    this.highlightResource();
    this.updateOutline();

    $('.authors .author').removeClass('active');
    
    if (this.model.resource) {
      $('.authors #'+_.htmlId(this.model.resource)).addClass('active');      
    }


    if (this.model.node && this.model.node !== 'all' && this.model.resource) {
      $('#document').addClass('focus-mode');
    } else {
      $('#document').removeClass('focus-mode');
    }

    // Set current selection mode
    $(this.el).removeClass('figure').removeClass('publication');
    $(this.el).addClass(this.model.resourceType);
  },

  // // Render Document Outline
  // // -------------
  // // 
  // // Renders outline and calculates heading bounds
  // // Used for auto-selecting current heading

  // renderOutline: function() {
  //   var that = this;
  //   var totalHeight = 0;
  //   var doc = this.model.document;

  //   that.$('.outline').empty();
  //   that.$('.outline').append('<div class="visible-area"></div>');

  //   var contentHeight = $('.nodes').height();
  //   var panelHeight = $('.outline').height();

  //   var factor = (contentHeight / panelHeight);
  //   this.factor = factor;

  //   _.each(doc["views"]["content"], function(node) {
  //     var n = doc.nodes[node];
  //     var dn = $('#node_'+_.htmlId(n.id));

  //     var height = dn.outerHeight(true) / factor;
      
  //     var $node = '<div class="node '+n.type+'" id="outline_'+_.htmlId(node)+'" style="position: absolute; height: '+(height-1)+'px; top:'+totalHeight+'px;"><div class="arrow"></div></div>';
  //     that.$('.outline').append($node);
  //     totalHeight += height;
  //   });


  //   // Init scroll pos
  //   var scrollTop = $('#container .content').scrollTop();
  //   $('.visible-area').css({
  //     "top": scrollTop / factor,
  //     "height": $('#document .outline').height() / factor
  //   });

  //   $('#container .content').unbind('scroll');
  //   $('#container .content').scroll(function() {
  //     // update outline scroll pos
  //     var scrollTop = $('#container .content').scrollTop();

  //     // Update visible area
  //     $('.visible-area').css({
  //       "top": scrollTop / factor,
  //       "height": $('#document .outline').height() / factor
  //     });

  //     that.markActiveHeading();
  //   });
  // },

  // Mark Active Heading
  // -------------
  // 
  // Used for auto-selecting current heading based
  // on current scroll position

  markActiveHeading: function() {
    var that = this;
    var scrollTop = $('#container .content').scrollTop();

    var headings = _.filter(that.model.document.views.content, function(n) {
      return that.model.document.nodes[n].type === "heading";
    });

    function getActiveNode() {
      var active = _.first(headings);
      $('#document .document .content-node.heading').each(function() {
        if (scrollTop >= $(this).position().top + CORRECTION) {
          active = _.nodeId(this.id);
        }
      });

      var contentHeight = $('.nodes').height();
      // Edge case: select last item (once we reach the end of the doc)
      if (scrollTop + $('#container .content').height() >= contentHeight) {
        // Find last heading
        active = _.last(headings);
      }
      return active;
    }

    var activeNode = getActiveNode();
    var tocEntry = $('.resources .headings a[data-node="'+activeNode+'"]');
    $('.resources .headings a.highlighted').removeClass('highlighted');
    tocEntry.addClass('highlighted');
  },

  // // Update Outline
  // // -------------
  // // 
  // // Renders outline and calculates heading bounds
  // // Used for auto-selecting current heading

  // updateOutline: function() {
  //   var that = this;
  //   var doc = this.model.document;

  //   // Reset
  //   this.$('.outline .node').removeClass('active').removeClass('highlighted');
  //   that.$('.outline').removeClass('figure').removeClass('publication');

  //   // 1. Mark active node
  //   if (this.model.node) {
  //     this.$('#outline_'+_.htmlId(this.model.node)).addClass('active');  
  //   }

  //   if (this.model.resource) {
  //     that.$('.outline').addClass(this.model.resourceType);

  //     var annotations = doc.find('reverse_annotations', this.model.resource);
  //     _.each(annotations, function(a) {
  //       var node = a.source;
  //       that.$('#outline_'+_.htmlId(node)).addClass('highlighted');
  //     });
  //   }
  // },

  // Recompute Layout properties
  // --------
  // 
  // This fixes some issues that can't be dealth with CSS

  updateDocLayout: function() {
    var docWidth = $('#document .document').width();
    $('.document .content-node').css('width', docWidth-15);
  },

  // Render
  // --------
  // 
  // Updates the browser's hash fragment based on the current
  // browsing context

  updatePath: function() {
    var path = [this.model.id];

    function getResourceType(t) {
      if (t === 'publication') return 'publications';
      if (t === 'figure') return 'figures';
      return t;
    }

    path.push(getResourceType(this.model.resourceType));

    if (this.model.node) {
      path.push(_.htmlId(this.model.node));
    } else {
      path.push('all');
    }

    if (this.model.resource) {
      path.push(_.htmlId(this.model.resource));
    }

    router.navigate(path.join('/'), {
      trigger: false,
      replace: false
    });
  },

  // Render Document
  // --------
  // 

  render: function(cb) {
    var that = this;

    var html = new Lens.Renderer(this.model.document, 'content').render();
    // Render Content
    $(this.el).html(_.tpl('content', {
      scope: "text", // TODO: remove scope
      content: html,
      title: this.model.document.properties.title,
      id: this.model.id
    }));

    // Render Resources
    this.resources = new Lens.Resources({
      model: this.model
    });

    this.$('.resources').html(this.resources.render().el);

    // Re-render outline on window resize
    var lazyOutline = _.debounce(function() {
      // Update width for .document .content-node elements
      that.renderOutline();
      that.updateOutline();
      that.updateDocLayout();
    }, 3);

    function displayDoc() {
      $('#document .document .nodes .content-node').css({opacity: 1});

      that.updateDocLayout();
      that.markActiveHeading();

      $('#container .loading').hide();
      
      var node = that.model.document.nodes[that.model.node];
      if (that.model.node) {
        that.selectNode(that.model.node);
        that.jumpToNode(that.model.node);
        that.updateResources();
      }

      that.renderOutline();
      that.updateOutline();
      that.updateDocLayout();
    }

    // Preload
    _.delay(function() {
      $('#document .document .nodes .content-node').css({opacity: 0});

      var figTotal = that.$('.content-node.image img.thumbnail').length;
      var figCount = 0;

      if (that.model.resourceType === 'figure' && that.model.resource) {
        that.$('.content-node.image img.thumbnail').load(function() {
          figCount += 1;
          if (figCount === figTotal) that.updateResources();
        });
      }

      MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

      // Show doc when typesetting math is done
      MathJax.Hub.Queue(displayDoc);
    }, 10);

    $(window).resize(lazyOutline);
    return this;
  }
});


// Export
// --------

root.Lens.Document = Document;

})(this);
