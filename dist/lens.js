(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

window.Lens = require("./src/lens");

},{"./src/lens":140}],2:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Document = require("substance-document");
var $$ = require("substance-application").$$;

// Lens.Article
// -----------------

var Article = function(options) {
  options = options || {};

  // Check if format is compatible

  // Extend Schema
  // --------

  options.schema = util.deepclone(Document.schema);

  options.schema.id = "lens-article";
  options.schema.version = "0.3.0";

  // Merge in custom types
  _.each(Article.types, function(type, key) {
    options.schema.types[key] = type;
  });

  // Register annotation types
  _.each(Article.annotations, function(aType, key) {
    options.schema.types[key] = aType;
  });


  // Merge in node types
  _.each(Article.nodeTypes, function(nodeSpec, key) {
    options.schema.types[key] = nodeSpec.Model.type;
  });

  // Merge in custom indexes
  _.each(Article.indexes, function(index, key) {
    options.schema.indexes[key] = index;
  });

  // Call parent constructor
  // --------

  Document.call(this, options);

  // Index for easy mapping from NLM sourceIds to generated nodeIds
  // Needed for resolving figrefs / citationrefs etc.
  this.bySourceId = this.addIndex("by_source_id", {
    types: ["content"],
    property: "source_id"
  });

  this.nodeTypes = Article.nodeTypes;

  // Seed the doc
  // --------

  if (options.seed === undefined) {
    this.create({
      id: "document",
      type: "document",
      guid: options.id, // external global document id
      creator: options.creator,
      created_at: options.created_at,
      views: ["content", "figures", "citations", "info"], // is views really needed on the instance level
      title: "",
      abstract: "",
      authors: []
    });

    // Create views on the doc
    _.each(Article.views, function(view) {
      this.create({
        id: view,
        "type": "view",
        nodes: []
      });
    }, this);
  }
};


// Renders an article
// --------
//

Article.Renderer = function(docCtrl, options) {
  this.docCtrl = docCtrl;

  this.nodeTypes = Article.nodeTypes;

  this.options = options || {};

  // Collect all node views
  this.nodes = {};

  // Build views
  _.each(this.docCtrl.getNodes(), function(node) {
    this.nodes[node.id] = this.createView(node);
  }, this);

};

Article.Renderer.Prototype = function() {

  // Create a node view
  // --------
  //
  // Experimental: using a factory which creates a view for a given node type
  // As we want to be able to reuse views
  // However, as the matter is still under discussion consider the solution here only as provisional.
  // We should create views, not only elements, as we need more, e.g., event listening stuff
  // which needs to be disposed later.

  this.createView = function(node) {
    var NodeView = this.nodeTypes[node.type].View;

    if (!NodeView) {
      throw new Error('Node type "'+node.type+'" not supported');
    }

    // Note: passing the factory to the node views
    // to allow creation of nested views
    var nodeView = new NodeView(node, this);

    // we connect the listener here to avoid to pass the document itself into the nodeView
    nodeView.listenTo(this.docCtrl, "operation:applied", nodeView.onGraphUpdate);
    return nodeView;
  };

  // Render it
  // --------
  //

  this.render = function() {
    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });

    var frag = document.createDocumentFragment();

    var docNodes = this.docCtrl.container.getTopLevelNodes();
    _.each(docNodes, function(n) {
      this.renderNode(n, frag);
    }, this);


    return frag;
  };


  this.renderNode = function(n, frag) {
    var view = this.createView(n);
    frag.appendChild(view.render().el);

    if (n.type === "heading") {
      view.el.appendChild($$('a.top', {
        href: "#",
        html: '<i class="icon-chevron-up"></i>'
      }));
    }


    // Lets you customize the resulting DOM sticking on the el element
    // Example: Lens focus controls
    if (this.options.afterRender) this.options.afterRender(this.docCtrl, view);
  };

};

Article.Renderer.prototype = new Article.Renderer.Prototype();


Article.Prototype = function() {
  this.fromSnapshot = function(data, options) {
    return Article.fromSnapshot(data, options);
  };

  // For a given NLM source id, returns the corresponding node in the document graph
  // --------

  this.getNodeBySourceId = function(sourceId) {
    var nodes = this.bySourceId.get(sourceId);
    var nodeId = Object.keys(nodes)[0];
    var node = nodes[nodeId];
    return node;
  };
};

// Factory method
// --------
//
// TODO: Ensure the snapshot doesn't get chronicled

Article.fromSnapshot = function(data, options) {
  options = options || {};
  options.seed = data;
  return new Article(options);
};


// Define available views
// --------

Article.views = ["content", "figures", "citations", "info"];


// Register node types
// --------

Article.nodeTypes = require("./nodes");


// Define annotation types
// --------

Article.annotations = {

  "strong": {
    "parent": "annotation",
    "properties": {
    }
  },

  "emphasis": {
    "properties": {
    },
    "parent": "annotation"
  },

  "subscript": {
    "properties": {
    },
    "parent": "annotation"
  },

  "superscript": {
    "properties": {
    },
    "parent": "annotation"
  },

  "underline": {
    "properties": {
    },
    "parent": "annotation"
  },

  "code": {
    "parent": "annotation",
    "properties": {
    }
  },

  "link": {
    "parent": "annotation",
    "properties": {
      "url": "string"
    }
  },

  "idea": {
    "parent": "annotation",
    "properties": {
    }
  },

  "error": {
    "parent": "annotation",
    "properties": {
    }
  },

  "question": {
    "parent": "annotation",
    "properties": {
    }
  },

  // Dark blueish contributor references in the cover
  // They should work everywhere else too

  "contributor_reference": {
    "parent": "annotation",
    "properties": {
      "target": "contributor"
    }
  },

  // Greenish figure references in the text

  "figure_reference": {
    "parent": "annotation",
    "properties": {
      "target": "figure"
    }
  },

  // Blueish citation references in the text

  "citation_reference": {
    "parent": "annotation",
    "properties": {
      "target": "content"
    }
  },

  "cross_reference": {
    "parent": "annotation",
    "properties": {
      "target": "content"
    }
  },

  "formula_reference": {
    "parent": "annotation",
    "properties": {
      "target": "content"
    }
  },

  "author_callout": {
    "parent": "annotation",
    "properties": {
      "style": "string"
    }
  }

};

// Custom type definitions
// --------
//
// Holds comments

Article.types = {

  // Abstarct Annotation Node
  // --------

  "annotation": {
    "properties": {
      "path": ["array", "string"], // -> e.g. ["text_1", "content"]
      "range": "object"
    }
  },

  // Abstract Figure Type
  // --------

  "figure": {
    "properties": {
    }
  },

  // "file": {
  //   "properties": {
  //   }
  // },

  "institution": {
    "properties": {
    }
  },

  "email": {
    "properties": {
    }
  },

  "funding": {
    "properties": {
    }
  },

  "caption": {
    "properties": {
    }
  },

  // Abstract Citation Type
  // --------

  "citation": {
    "properties": {
    }
  },

  // Document
  // --------

  "document": {
    "properties": {
      "views": ["array", "view"],
      "guid": "string",
      "creator": "string",
      "title": "string",
      "authors": ["array", "contributor"],
      "on_behalf_of": "string",
      "abstract": "string"
    }
  },

  // Comments
  // --------

  "comment": {
    "properties": {
      "content": "string",
      "created_at": "string", // should be date
      "creator": "string", // should be date
      "node": "node" // references either a content node or annotation
    }
  }
};

// From article definitions generate a nice reference document
// --------
//


var ARTICLE_DOC_SEED = {
  "id": "lens_article",
  "nodes": {
    "document": {
      "type": "document",
      "id": "document",
      "views": [
        "content"
      ],
      "title": "The Anatomy of a Lens Article",
      "authors": ["contributor_1", "contributor_2", "contributor_3"],
      "guid": "lens_article"
    },


    "content": {
      "type": "view",
      "id": "content",
      "nodes": [
        "cover",
      ]
    },

    "cover": {
      "id": "cover",
      "type": "cover"
    },

    "contributor_1": {
      "id": "contributor_1",
      "type": "contributor",
      "name": "Michael Aufreiter"
    },

    "contributor_2": {
      "id": "contributor_2",
      "type": "contributor",
      "name": "Ivan Grubisic"
    },

    "contributor_3": {
      "id": "contributor_3",
      "type": "contributor",
      "name": "Rebecca Close"
    }
  }
};

Article.describe = function() {
  var doc = new Article({seed: ARTICLE_DOC_SEED});

  var id = 0;

  _.each(Article.nodeTypes, function(nodeType) {
    nodeType = nodeType.Model;

    // Create a heading for each node type
    var headingId = "heading_"+nodeType.type.id;

    doc.create({
      id: headingId,
      type: "heading",
      content: nodeType.description.name,
      level: 1
    });

    // Turn remarks and description into an introduction paragraph
    var introText = nodeType.description.remarks.join(' ');
    var introId = "text_"+nodeType.type.id+"_intro";

    doc.create({
      id: introId,
      type: "text",
      content: introText,
    });


    // Show it in the content view
    doc.show("content", [headingId, introId], -1);


    // Include property description
    // --------
    //

    doc.create({
      id: headingId+"_properties",
      type: "text",
      content: nodeType.description.name+ " uses the following properties:"
    });

    doc.show("content", [headingId+"_properties"], -1);

    var items = [];

    _.each(nodeType.description.properties, function(propertyDescr, key) {

      var listItemId = "text_" + (++id);
      doc.create({
        id: listItemId,
        type: "text",
        content: key +": " + propertyDescr
      });

      // Create code annotation for the propertyName
      doc.create({
        "id": id+"_annotation",
        "type": "code",
        "path": [listItemId, "content"],
        "range":[0, key.length]
      });

      items.push(listItemId);
    });

    // Create list
    doc.create({
      id: headingId+"_property_list",
      type: "list",
      items: items,
      ordered: false
    });

    // And show it
    doc.show("content", [headingId+"_property_list"], -1);

    // Include example
    // --------
    //

    doc.create({
      id: headingId+"_example",
      type: "text",
      content: "Here's an example:"
    });

    doc.create({
      id: headingId+"_example_codeblock",
      type: "codeblock",
      content: JSON.stringify(nodeType.example, null, '  '),
    });

    doc.show("content", [headingId+"_example", headingId+"_example_codeblock"], -1);
  });

  return doc;
};


Article.Prototype.prototype = Document.prototype;
Article.prototype = new Article.Prototype();
Article.prototype.constructor = Article;


// Add convenience accessors for builtin document attributes
Object.defineProperties(Article.prototype, {
  id: {
    get: function () {
      return this.get("document").guid;
    },
    set: function(id) {
      this.get("document").guid = id;
    }
  },
  creator: {
    get: function () {
      return this.get("document").creator;
    },
    set: function(creator) {
      this.get("document").creator = creator;
    }
  },
  created_at: {
    get: function () {
      return this.get("document").created_at;
    },
    set: function(created_at) {
      this.get("document").created_at = created_at;
    }
  },
  title: {
    get: function () {

      return this.get("document").title;
    },
    set: function(title) {
      this.get("document").title = title;
    }
  },
  abstract: {
    get: function () {
      return this.get("document").abstract;
    },
    set: function(abstract) {
      this.get("document").abstract = abstract;
    }
  },
  on_behalf_of: {
    get: function () {
      return this.get("document").on_behalf_of;
    },
    set: function(on_behalf_of) {
      this.get("document").on_behalf_of = on_behalf_of;
    }
  },
  authors: {
    get: function () {
      var docNode = this.get("document");
      if (docNode.authors) {
        return _.map(docNode.authors, function(contributorId) {
          return this.get(contributorId);
        }, this);
      } else {
        return "";
      }
    },
    set: function(val) {
      var docNode = this.get("document");
      docNode.authors = _.clone(val);
    }
  },
  views: {
    get: function () {
      // Note: returing a copy to avoid inadvertent changes
      return this.get("document").views.slice(0);
    }
  },
});

module.exports = Article;

},{"./nodes":29,"substance-application":57,"substance-document":68,"substance-util":134,"underscore":139}],3:[function(require,module,exports){
"use strict";

var Article = require("./article");

module.exports = Article;
},{"./article":2}],4:[function(require,module,exports){
"use strict";

var Node = require("substance-document").Node;
var _ = require("underscore");

var Affiliation = function(node, doc) {
  Node.call(this, node, doc);
};

Affiliation.type = {
  "id": "affiliation",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "city": "string",
    "country": "string",
    "department": "string",
    "institution": "string",
    "label": "string"
  }
};


Affiliation.description = {
  "name": "Affiliation",
  "description": "Person affiliation",
  "remarks": [
    "Name of a institution or organization, such as a university or corporation, that is the affiliation for a contributor such as an author or an editor."
  ],
  "properties": {
    "institution": "Name of institution",
    "department": "Department name",
    "country": "Country where institution is located",
    "city": "City of institution",
    "label": "Affilation label. Usually a number counting up"
  }
};


Affiliation.example = {
  "id": "affiliation_1",
  "source_id": "aff1",
  "city": "Jena",
  "country": "Germany",
  "department": "Department of Molecular Ecology",
  "institution": "Max Planck Institute for Chemical Ecology",
  "label": "1",
  "type": "affiliation"
};

Affiliation.Prototype = function() {

};

Affiliation.Prototype.prototype = Node.prototype;
Affiliation.prototype = new Affiliation.Prototype();
Affiliation.prototype.constructor = Affiliation;


// Generate getters
// --------

var getters = {};

_.each(Affiliation.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});

Object.defineProperties(Affiliation.prototype, getters);

module.exports = Affiliation;

},{"substance-document":68,"underscore":139}],5:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./affiliation')
};

},{"./affiliation":4}],6:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Lens.Box
// -----------------
//

var Box = function(node, doc) {
  Node.call(this, node, doc);
};


// Type definition
// -----------------
//

Box.type = {
  "id": "box",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "children": ["array", "paragraph"]
  }
};

// This is used for the auto-generated docs
// -----------------
//

Box.description = {
  "name": "Box",
  "remarks": [
    "A box type.",
  ],
  "properties": {
    "label": "string",
    "children": "0..n Paragraph nodes",
  }
};


// Example Box
// -----------------
//

Box.example = {
  "id": "box_1",
  "type": "box",
  "label": "Box 1",
  "children": ["paragraph_1", "paragraph_2"]
};

Box.Prototype = function() {

};

Box.Prototype.prototype = Node.prototype;
Box.prototype = new Box.Prototype();
Box.prototype.constructor = Box;


// Generate getters
// --------

var getters = {};

var getters = {
  header: {
    get: function() {
      return this.properties.label;
    }
  }
};

_.each(Box.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});


Object.defineProperties(Box.prototype, getters);

module.exports = Box;

},{"substance-document":68,"underscore":139}],7:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;


// Lens.Box.View
// ==========================================================================

var BoxView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node box");
};

BoxView.Prototype = function() {

  // Render it
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Create children views
    // --------
    // 

    var children = this.node.children;

    _.each(children, function(nodeId) {
      var child = this.node.document.get(nodeId);
      var childView = this.viewFactory.createView(child);
      var childViewEl = childView.render().el;
      this.content.appendChild(childViewEl);
    }, this);

    this.el.appendChild(this.content);

    return this;
  };
};

BoxView.Prototype.prototype = NodeView.prototype;
BoxView.prototype = new BoxView.Prototype();

module.exports = BoxView;

},{"../node":31,"substance-application":57,"substance-util":134,"underscore":139}],8:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./box'),
  View: require('./box_view')
};

},{"./box":6,"./box_view":7}],9:[function(require,module,exports){
"use strict";

var Document = require("substance-document");

var Caption = function(node, document) {
  Document.Composite.call(this, node, document);
};

Caption.type = {
  "id": "caption",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "title": "paragraph",
    "children": ["array", "paragraph"]
  }
};

// This is used for the auto-generated docs
// -----------------
//

Caption.description = {
  "name": "Caption",
  "remarks": [
    "Container element for the textual description that is associated with a Figure, Table, Video node etc.",
    "This is the title for the figure or the description of the figure that prints or displays with the figure."
  ],
  "properties": {
    "title": "Caption title (optional)",
    "children": "0..n Paragraph nodes",
  }
};


// Example File
// -----------------
//

Caption.example = {
  "id": "caption_1",
  "children": [
    "paragraph_1",
    "paragraph_2"
  ]
};

Caption.Prototype = function() {

  this.hasTitle = function() {
    return (!!this.properties.title);
  };

  // The nodes the composite should spit out
  this.getNodes = function() {
    var nodes = [];

    if (this.properties.children) {
      nodes = nodes.concat(this.properties.children);
    }
    return nodes;
  };

  this.getTitle = function() {
    if (this.properties.title) return this.document.get(this.properties.title);
  };

  // this.getCaption = function() {
  //   if (this.properties.caption) return this.document.get(this.properties.caption);
  // };
};

Caption.Prototype.prototype = Document.Composite.prototype;
Caption.prototype = new Caption.Prototype();
Caption.prototype.constructor = Caption;

Document.Node.defineProperties(Caption.prototype, ["title", "children"]);

module.exports = Caption;

},{"substance-document":68}],10:[function(require,module,exports){
"use strict";

var CompositeView = require("../composite").View;
var List = require("substance-document").List;
var $$ = require("substance-application").$$;

// Lens.Caption.View
// ==========================================================================

var CaptionView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};


CaptionView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.content = $$('div.content');

    var i;

    // dispose existing children views if called multiple times
    for (i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }

    // Add title paragraph
    var titleNode = this.node.getTitle();
    if (titleNode) {
      var titleView = this.viewFactory.createView(titleNode);
      var titleEl = titleView.render().el;
      titleEl.classList.add('caption-title');
      this.content.appendChild(titleEl);
    }

    // create children views
    var children = this.node.getNodes();
    for (i = 0; i < children.length; i++) {
      var child = this.node.document.get(children[i]);
      var childView = this.viewFactory.createView(child);
      var childViewEl = childView.render().el;
      this.content.appendChild(childViewEl);
      this.childrenViews.push(childView);
    }

    this.el.appendChild(this.content);
    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id && op.path[1] === "items") {
      this.render();
    }
  };

};

CaptionView.Prototype.prototype = CompositeView.prototype;
CaptionView.prototype = new CaptionView.Prototype();

module.exports = CaptionView;

},{"../composite":16,"substance-application":57,"substance-document":68}],11:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./caption"),
  View: require("./caption_view")
};

},{"./caption":9,"./caption_view":10}],12:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Lens.Citation
// -----------------
//

var Citation = function(node) {
  Node.call(this, node);
};

// Type definition
// -----------------
//

Citation.type = {
  "id": "article_citation", // type name
  "parent": "content",
  "properties": {
    "source_id": "string",
    "title": "string",
    "label": "string",
    "authors": ["array", "string"],
    "doi": "string",
    "source": "string",
    "volume": "string",
    "publisher_name": "string",
    "publisher_location": "string",
    "fpage": "string",
    "lpage": "string",
    "year": "string",
    "citation_urls": ["array", "string"]
  }
};

// This is used for the auto-generated docs
// -----------------
//

Citation.description = {
  "name": "Citation",
  "remarks": [
    "A journal citation.",
    "This element can be used to describe all kinds of citations."
  ],
  "properties": {
    "title": "The article's title",
    "label": "Optional label (could be a number for instance)",
    "doi": "DOI reference",
    "source": "Usually the journal name",
    "volume": "Issue number",
    "publisher_name": "Publisher Name",
    "publisher_location": "Publisher Location",
    "fpage": "First page",
    "lpage": "Last page",
    "year": "The year of publication",
    "citation_urls": "A list of links for accessing the article on the web"
  }
};



// Example Citation
// -----------------
//

Citation.example = {
  "id": "article_nature08160",
  "type": "article_citation",
  "label": "5",
  "title": "The genome of the blood fluke Schistosoma mansoni",
  "authors": [
    "M Berriman",
    "BJ Haas",
    "PT LoVerde"
  ],
  "doi": "http://dx.doi.org/10.1038/nature08160",
  "source": "Nature",
  "volume": "460",
  "fpage": "352",
  "lpage": "8",
  "year": "1984",
  "citation_urls": [
    "http://www.ncbi.nlm.nih.gov/pubmed/19606141"
  ]
};


Citation.Prototype = function() {
  // Returns the citation URLs if available
  // Falls back to the DOI url
  // Always returns an array;
  this.urls = function() {
    return this.properties.citation_urls.length > 0 ? this.properties.citation_urls
                                                    : [this.properties.doi];
  };
};

Citation.Prototype.prototype = Node.prototype;
Citation.prototype = new Citation.Prototype();
Citation.prototype.constructor = Citation;

// Generate getters
// --------

var getters = {
  header: {
    get: function() {
      if (this.properties.label) {
        return [this.properties.label,this.properties.title].join(". ")
      }
      else {
        return this.properties.title;
      }
    }
  }
};

_.each(Citation.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});

Object.defineProperties(Citation.prototype, getters);

module.exports = Citation;

},{"substance-document":68,"underscore":139}],13:[function(require,module,exports){
"use strict";

var _ = require('underscore');
var util = require('substance-util');
var html = util.html;
var NodeView = require("../node").View;

var $$ = require("substance-application").$$;

var Renderer = function(view) {
    var frag = document.createDocumentFragment(),
        node = view.node;


    // Add Authors
    // -------

    frag.appendChild($$('.authors', {
      html: node.authors.join(', ')
    }));


    // Add Source
    // -------

    var source = [];
    
    // Hack for handling unstructured citation types and render prettier
    if (node.source && node.volume === ''){
      source.push(node.source);
    }
    
    if (node.source && node.volume) {
      source.push([node.source, node.volume].join(', ')+": ");
    }

    if (node.fpage && node.lpage) {
      source.push([node.fpage, node.lpage].join('-')+", ");
    }

    if (node.publisher_name && node.publisher_location) {
      source.push([node.publisher_name, node.publisher_location].join(', ')+", ");
    }

    if (node.year) {
      source.push(node.year);
    }

    frag.appendChild($$('.source', {
      html: source.join('')
    }));

    // Add DOI (if available)
    // -------

    if (node.doi) {
      frag.appendChild($$('.doi', {
        children: [
          $$('b', {text: "DOI: "}),
          $$('a', {
            href: node.doi,
            target: "_new",
            text: node.doi
          })
        ]
      }));
    }

    // TODO: Add display citations urls
    // -------

    return frag;
};


// Lens.Citation.View
// ==========================================================================


var CitationView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass('citation');
};


CitationView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);
    this.content.appendChild(new Renderer(this));
    return this;
  };

};

CitationView.Prototype.prototype = NodeView.prototype;
CitationView.prototype = new CitationView.Prototype();
CitationView.prototype.constructor = CitationView;

module.exports = CitationView;

},{"../node":31,"substance-application":57,"substance-util":134,"underscore":139}],14:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./citation'),
  View: require('./citation_view')
};

},{"./citation":12,"./citation_view":13}],15:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["codeblock"];

},{"substance-nodes":79}],16:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["composite"];

},{"substance-nodes":79}],17:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Lens.Contributor
// -----------------
//

var Contributor = function(node, doc) {
  Node.call(this, node, doc);
};


// Type definition
// -----------------
//

Contributor.type = {
  "id": "contributor",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "name": "string", // full name
    "role": "string",
    "affiliations": ["array", "affiliation"],
    "present_address": ["string"],
    "fundings": ["array", "string"],
    "image": "string", // optional
    "emails": ["array", "string"],
    "contribution": "string",
    "deceased": "boolean",
    "members": ["array", "string"],
    "orcid": "string",
    "equal_contrib": ["array", "string"],
    "competing_interests": ["array", "string"]
  }
};


// This is used for the auto-generated docs
// -----------------
//

Contributor.description = {
  "name": "Contributor",
  "remarks": [
    "A contributor entity.",
  ],
  "properties": {
    "name": "Full name",
    "affiliations": "A list of affiliation ids",
    "present_address": "Present address of the contributor",
    "role": "Role of contributor (e.g. Author, Editor)",
    "fundings": "A list of funding descriptions",
    "deceased": false,
    "emails": "A list of emails",
    "orcid": "ORCID",
    "contribution": "Description of contribution",
    "equal_contrib": "A list of people who contributed equally",
    "competing_interests": "A list of conflicts",
    "members": "a list of group members"
  }
};


// Example Video
// -----------------
//

Contributor.example = {
  "id": "person_1",
  "type": "contributor",
  "name": "John Doe",
  "affiliations": ["affiliation_1", "affiliation_2"],
  "role": "Author",
  "fundings": ["Funding Organisation 1"],
  "emails": ["a@b.com"],
  "contribution": "Revising the article, data cleanup",
  "equal_contrib": ["John Doe", "Jane Doe"]
};


Contributor.Prototype = function() {
  this.getAffiliations = function() {
    return _.map(this.properties.affiliations, function(affId) {
      return this.document.get(affId);
    }, this);
  }
};

Contributor.Prototype.prototype = Node.prototype;
Contributor.prototype = new Contributor.Prototype();
Contributor.prototype.constructor = Contributor;


// Generate getters
// --------

var getters = {};

var getters = {
  header: {
    get: function() {
      return this.properties.name;
    }
  }
};

_.each(Contributor.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});



Object.defineProperties(Contributor.prototype, getters);

module.exports = Contributor;

},{"substance-document":68,"underscore":139}],18:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;

// Lens.Contributor.View
// ==========================================================================

var ContributorView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node contributor");
};

ContributorView.Prototype = function() {

  // Render it
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Add Affiliations
    // -------

    this.content.appendChild($$('.affiliations', {
      children: _.map(this.node.getAffiliations(), function(aff) {
        
        var affText = _.compact([
          aff.department, 
          aff.institution,
          aff.city,
          aff.country
        ]).join(', ');

        return $$('.affiliation', {text: affText});
      })
    }));



    // Present Address
    // -------

    if (this.node.present_address) {
      this.content.appendChild($$('.label', {text: 'Present address'}));
      this.content.appendChild($$('.contribution', {text: this.node.present_address}));
    }

    // Contribution
    // -------

    if (this.node.contribution) {
      this.content.appendChild($$('.label', {text: 'Contribution'}));
      this.content.appendChild($$('.contribution', {text: this.node.contribution}));
    }

    // Equal contribution
    // -------

    if (this.node.equal_contrib && this.node.equal_contrib.length > 0) {
      this.content.appendChild($$('.label', {text: 'Contributed equally with'}));
      this.content.appendChild($$('.equal-contribution', {text: this.node.equal_contrib}));
    }


    // Emails
    // -------
    
    if (this.node.emails.length > 0) {
      this.content.appendChild($$('.label', {text: 'For correspondence'}));
      this.content.appendChild($$('.emails', {
        children: _.map(this.node.emails, function(email) {
          return $$('a', {href: "mailto:"+email, text: email});
        })
      }));
    }


    // Funding
    // -------

    if (this.node.fundings.length > 0) {
      this.content.appendChild($$('.label', {text: 'Funding'}));
      this.content.appendChild($$('.fundings', {
        children: _.map(this.node.fundings, function(funding) {
          return $$('.funding', {text: funding});
        })
      }));
    }


    // Competing interests
    // -------
    
    if (this.node.competing_interests.length > 0) {
      this.content.appendChild($$('.label', {text: 'Competing Interests'}));
      this.content.appendChild($$('.competing-interests', {
        children: _.map(this.node.competing_interests, function(ci) {
          return $$('.conflict', {text: ci});
        })
      }));
    }


    // ORCID if available
    // -------
    
    if (this.node.orcid) {
      this.content.appendChild($$('.label', { text: 'ORCID' }));
      this.content.appendChild($$('a.orcid', { href: this.node.orcid, text: this.node.orcid }));
    }


    // Group member (in case contributor is a person group)
    // -------

    if (this.node.members.length > 0) {
      this.content.appendChild($$('.label', {text: 'Group Members'}));
      this.content.appendChild($$('.members', {
        children: _.map(this.node.members, function(member) {
          return $$('.member', {text: member});
        })
      }));
    }

    // Deceased?
    // -------

    if (this.node.deceased) {
      // this.content.appendChild($$('.label', {text: 'Present address'}));
      this.content.appendChild($$('.label', {text: "* Deceased"}));
    }

    return this;
  };

};

ContributorView.Prototype.prototype = NodeView.prototype;
ContributorView.prototype = new ContributorView.Prototype();

module.exports = ContributorView;

},{"../node":31,"substance-application":57,"substance-util":134,"underscore":139}],19:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./contributor'),
  View: require('./contributor_view')
};

},{"./contributor":17,"./contributor_view":18}],20:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Lens.Cover
// -----------------
//

var Cover = function(node, doc) {
  Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Cover.type = {
  "id": "cover",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "authors": ["array", "paragraph"],
    "breadcrumbs": "object"
    // No properties as they are all derived from the document node
  }
};


// This is used for the auto-generated docs
// -----------------
//

Cover.description = {
  "name": "Cover",
  "remarks": [
    "Virtual view on the title and authors of the paper."
  ],
  "properties": {
    "authors": "A paragraph that has the authors names plus references to the person cards"
  }
};

// Example Cover
// -----------------
//

Cover.example = {
  "id": "cover",
  "type": "cover"
};

Cover.Prototype = function() {

  this.getAuthors = function() {
    return _.map(this.properties.authors, function(paragraphId) {
      return this.document.get(paragraphId);
    }, this);
  };

};

Cover.Prototype.prototype = Node.prototype;
Cover.prototype = new Cover.Prototype();
Cover.prototype.constructor = Cover;

// Generate getters
// --------

var getters = {};


Object.defineProperties(Cover.prototype, {
  title: {
    get: function() {
      return this.document.title;
    }
  },
  authors: {
    // Expand author id's to corresponding person nodes
    get: function() {
      return this.document.authors;
    }
  },
  breadcrumbs: {
    // Expand author id's to corresponding person nodes
    get: function() {
      return this.properties.breadcrumbs;
    }
  }
});

module.exports = Cover;

},{"substance-document":68,"underscore":139}],21:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;

// Lens.Cover.View
// ==========================================================================

var CoverView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node cover");
};


CoverView.Prototype = function() {

  // Render it
  // --------
  //
  // .content
  //   video
  //     source
  //   .title
  //   .caption
  //   .doi

  this.render = function() {
    NodeView.prototype.render.call(this);
    var node = this.node;

    if (node.breadcrumbs && node.breadcrumbs.length > 0) {
      var breadcrumbs = $$('.breadcrumbs', {
        children: _.map(node.breadcrumbs, function(bc) {
          var html;
          if (bc.image) {
            html = '<img src="'+bc.image+'" title="'+bc.name+'"/>';
          } else {
            html = bc.name;  
          }
          return $$('a', {href: bc.url, html: html})
        })
      });
      this.content.appendChild(breadcrumbs);
    }

    var pubInfo = this.node.document.get('publication_info');

    if (pubInfo) {
      var localDate = new Date(pubInfo.published_on);

      if (pubInfo) {
        var pubDate = pubInfo.published_on;
        if (pubDate) {
          this.content.appendChild($$('.published-on', {
            text: localDate.toUTCString().slice(0, 16)
          }));
        }
      }
    }

    this.content.appendChild($$('.title', {text: node.title }));

    var authors = $$('.authors', {
      children: _.map(node.getAuthors(), function(authorPara) {
        var paraView = this.viewFactory.createView(authorPara);
        var paraEl = paraView.render().el;
        this.content.appendChild(paraEl);
        return paraEl;
      }, this)
    });

    authors.appendChild($$('.content-node.text.plain', {
      children: [
        $$('.content', {text: this.node.document.on_behalf_of})
      ]
    }));

    this.content.appendChild(authors);

    if (pubInfo) {
      var doi = pubInfo.doi;
      if (doi) {
        this.content.appendChild($$('.doi', {
          html: 'DOI: <a href="'+doi+'">'+doi+'</a>'
        }));
      }
    }

    return this;
  }
};

CoverView.Prototype.prototype = NodeView.prototype;
CoverView.prototype = new CoverView.Prototype();

module.exports = CoverView;

},{"../node":31,"substance-application":57,"substance-util":134,"underscore":139}],22:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./cover'),
  View: require('./cover_view')
};

},{"./cover":20,"./cover_view":21}],23:[function(require,module,exports){
"use strict";

var Document = require("substance-document");

var Figure = function(node, document) {
  Document.Composite.call(this, node, document);
};


Figure.type = {
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "caption": "caption",
    "attrib": "string"
  }
};

Figure.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Figure.description = {
  "name": "Figure",
  "remarks": [
    "A figure is a figure is figure.",
  ],
  "properties": {
    "label": "Label used as header for the figure cards",
    "url": "Image url",
    "caption": "A reference to a caption node that describes the figure",
    "attrib": "Figure attribution"
  }
};

// Example File
// -----------------
//

Figure.example = {
  "id": "figure_1",
  "label": "Figure 1",
  "url": "http://example.com/fig1.png",
  "caption": "caption_1"
};

Figure.Prototype = function() {

  this.hasCaption = function() {
    return (!!this.properties.caption);
  };

  this.getNodes = function() {
    var nodes = [];
    if (this.properties.caption) {
      nodes.push(this.properties.caption);
    }
    return nodes;
  };

  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };
};

Figure.Prototype.prototype = Document.Composite.prototype;
Figure.prototype = new Figure.Prototype();
Figure.prototype.constructor = Figure;

Document.Node.defineProperties(Figure.prototype, ["source_id", "label", "url", "caption", "attrib"]);

Object.defineProperties(Figure.prototype, {
  // Used as a resource header
  header: {
    get: function() { return this.properties.label; }
  }
});

module.exports = Figure;

},{"substance-document":68}],24:[function(require,module,exports){
"use strict";

var CompositeView = require("../composite").View;
var $$ = require ("substance-application").$$;

// Substance.Figure.View
// ==========================================================================

var FigureView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

FigureView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {

    this.el.innerHTML = "";
    this.content = $$('div.content');

    // Add graphic (img element)
    var imgEl = $$('.image-wrapper', {
      children: [
        $$("a", {
          href: this.node.url,
          target: "_blank",
          children: [$$("img", {src: this.node.url})]
        })
      ]
    });

    this.content.appendChild(imgEl);


    var caption = this.node.getCaption();
    if (caption) {
      var captionView = this.viewFactory.createView(caption);
      var captionEl = captionView.render().el;
      this.content.appendChild(captionEl);
      this.childrenViews.push(captionView);
    }

    // Attrib
    if (this.node.attrib) {
      console.log('ATTRIB!!');
      this.content.appendChild($$('.figure-attribution', {text: this.node.attrib}));
    }

    this.el.appendChild(this.content);
    return this;
  };
};

FigureView.Prototype.prototype = CompositeView.prototype;
FigureView.prototype = new FigureView.Prototype();

module.exports = FigureView;

},{"../composite":16,"substance-application":57}],25:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./figure'),
  View: require('./figure_view')
};

},{"./figure":23,"./figure_view":24}],26:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["formula"];

},{"substance-nodes":79}],27:[function(require,module,exports){
"use strict";
var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["heading"];

},{"substance-nodes":79}],28:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");
module.exports = SubstanceNodes["image"];
},{"substance-nodes":79}],29:[function(require,module,exports){
"use strict";
module.exports = {
  "publication_info": require("./publication_info"),
  "box": require("./box"),
  "cover": require("./cover"),
  "text": require("./text"),
  "paragraph": require("./paragraph"),
  "heading": require("./heading"),
  "figure": require("./figure"),
  "caption": require("./caption"),
  "image": require("./image"),
  "webresource": require("./web_resource"),
  "table": require("./table"),
  "supplement": require("./supplement"),
  "video": require("./video"),
  "contributor": require("./contributor"),
  "citation": require("./citation"),
  "formula": require('./formula'),
  "list": require("./list"),
  "codeblock": require("./codeblock"),
  "affiliation": require("./_affiliation")
};

},{"./_affiliation":5,"./box":8,"./caption":11,"./citation":14,"./codeblock":15,"./contributor":19,"./cover":22,"./figure":25,"./formula":26,"./heading":27,"./image":28,"./list":30,"./paragraph":32,"./publication_info":33,"./supplement":36,"./table":39,"./text":42,"./video":44,"./web_resource":47}],30:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["list"];

},{"substance-nodes":79}],31:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["node"];

},{"substance-nodes":79}],32:[function(require,module,exports){
"use strict";

var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["paragraph"];

},{"substance-nodes":79}],33:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./publication_info"),
  View: require("./publication_info_view")
};

},{"./publication_info":34,"./publication_info_view":35}],34:[function(require,module,exports){
"use strict";

var Node = require("substance-document").Node;
var _ = require("underscore");

var PublicationInfo = function(node, doc) {
  Node.call(this, node, doc);
};


PublicationInfo.type = {
  "id": "publication_info",
  "parent": "content",
  "properties": {
    "received_on": "string",
    "accepted_on": "string",
    "published_on": "string",
    "journal": "string",
    "article_type": "string",
    "keywords": ["array", "string"],
    "research_organisms": ["array", "string"],
    "subjects": ["array", "string"],
    "pdf_link": "string",
    "xml_link": "string",
    "json_link": "string",
    "doi": "string",
    "related_article": "string"
  }
};


PublicationInfo.description = {
  "name": "PublicationInfo",
  "description": "PublicationInfo Node",
  "remarks": [
    "Summarizes the article's meta information. Meant to be customized by publishers"
  ],
  "properties": {
    "received_on": "Submission received",
    "accepted_on": "Paper accepted on",
    "published_on": "Paper published on",
    "journal": "The Journal",
    "article_type": "Research Article vs. Insight, vs. Correction etc.",
    "keywords": "Article's keywords",
    "research_organisms": "Research Organisms",
    "subjects": "Article Subjects",
    "pdf_link": "A link referencing the PDF version for print",
    "xml_link": "A link referencing the original NLM XML file",
    "json_link": "A link pointing to the JSON version of the article",
    "doi": "Article DOI",
    "related_article": "DOI of related article if there is any"
  }
};


PublicationInfo.example = {
  "id": "publication_info",
  "received_on": "2012-06-20",
  "accepted_on": "2012-09-05",
  "published_on": "2012-11-13",
  "journal": "eLife",
  "article_type": "Research Article",
  "keywords": [
    "innate immunity",
    "histones",
    "lipid droplet",
    "anti-bacterial"
  ],
  "research_organisms": [
    "B. subtilis",
    "D. melanogaster",
    "E. coli",
    "Mouse"
  ],
  "subjects": [
    "Immunology",
    "Microbiology and infectious disease"
  ],
  "pdf_link": "http://elife.elifesciences.org/content/1/e00003.full-text.pdf",
  "xml_link": "https://s3.amazonaws.com/elife-cdn/elife-articles/00003/elife00003.xml",
  "json_link": "http://cdn.elifesciences.org/documents/elife/00003.json",
  "doi": "http://dx.doi.org/10.7554/eLife.00003"
};


PublicationInfo.Prototype = function() {
};


PublicationInfo.Prototype.prototype = Node.prototype;
PublicationInfo.prototype = new PublicationInfo.Prototype();
PublicationInfo.prototype.constructor = PublicationInfo;


// Generate getters
// --------

var getters = {};

_.each(PublicationInfo.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});

Object.defineProperties(PublicationInfo.prototype, getters);

module.exports = PublicationInfo;
},{"substance-document":68,"underscore":139}],35:[function(require,module,exports){
"use strict";

var NodeView = require("../node").View;
var $$ = require("substance-application").$$;


// Substance.Image.View
// ==========================================================================

var PublicationInfoView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass('publication-info');
  this.$el.attr('id', this.node.id);
};

PublicationInfoView.Prototype = function() {

  // Rendering
  // =============================
  //


  // Render Markup
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    var tableRows = [
      $$('tr', {
        children: [
          $$('td', {
            colspan: 2,
            children: [
              $$('div.label', {text: "Article Type"}),
              $$('div', {text: this.node.article_type})
            ]
          })
        ]
      }),
      $$('tr', {
        children: [
          $$('td', {
            children: [
              $$('div.label', {text: "Subject"}),
              $$('div.value', {text: this.node.subjects.join(', ')})
            ]
          }),
          $$('td', {
            children: [
              $$('div.label', {text: "Organism"}),
              $$('div.value', {text: this.node.research_organisms.join(', ')})
            ]
          })
        ]
      }),
      $$('tr', {
        children: [
          $$('td', {
            colspan: 2,
            children: [
              $$('div.label', {text: "Keywords"}),
              $$('div.value', {text: this.node.keywords.join(', ')})
            ]
          })
        ]
      })
    ];


    // Display related article if there is any
    // ----------------

    if (this.node.related_article) {
      tableRows.push($$('tr', {
        children: [
          $$('td', {
            colspan: 2,
            children: [
              $$('div.label', {text: "Related Article"}),
              $$('a.value', {href: this.node.related_article, text: this.node.related_article})
            ]
          })
        ]
      }));
    }
    

    var catTbl = $$('table.categorization', {
      children: [ $$('tbody', { children: tableRows }) ]
    });

    this.content.appendChild(catTbl);
      
    // Prepare for download the JSON
    var json = JSON.stringify(this.node.document.toJSON(), null, '  ');
    var bb = new Blob([json], {type: "application/json"});

    var links = $$('.links', {
      children: [
        $$('a.link pdf-link', {
          href: this.node.pdf_link,
          html: '<i class="icon-download-alt"></i> PDF'
        }),
        $$('a.link.json-link', {
          href: window.URL ? window.URL.createObjectURL(bb) : "#",
          html: '<i class="icon-download-alt"></i> JSON'
        }),
        $$('a.link.xml-link', {
          href: this.node.xml_link,
          html: '<i class="icon-download-alt"></i> XML'
        }),
        $$('a.link.doi-link', {
          href: this.node.doi,
          html: '<i class="icon-external-link-sign"></i> DOI'
        })
      ]
    });

    this.content.appendChild(links);

    var dateRows = [
      $$('tr', {
        children: [
          $$('td', {
            children: [
              $$('div.label', {text: "Received"}),
              $$('div.value', {text: this.node.received_on || "-" })
            ]
          }),
          $$('td', {
            children: [
              $$('div.label', {text: "Accepted"}),
              $$('div.value', {text: this.node.accepted_on || "-" })
            ]
          }),
          $$('td', {
            children: [
              $$('div.label', {text: "Published"}),
              $$('div.value', {text: this.node.published_on || "-" })
            ]
          })
        ]
      })
    ];
    
    var datesTbl = $$('table.dates', {
      children: [ $$('tbody', { children: dateRows }) ]
    });

    this.content.appendChild(datesTbl);
    return this;
  };

  this.dispose = function() {
    NodeView.prototype.dispose.call(this);
  };
};

PublicationInfoView.Prototype.prototype = NodeView.prototype;
PublicationInfoView.prototype = new PublicationInfoView.Prototype();

module.exports = PublicationInfoView;

},{"../node":31,"substance-application":57}],36:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./supplement'),
  View: require('./supplement_view')
};

},{"./supplement":37,"./supplement_view":38}],37:[function(require,module,exports){
var _ = require('underscore');

var Document = require("substance-document");

// Lens.Supplement
// -----------------
//

var Supplement = function(node, doc) {
  Document.Composite.call(this, node, doc);
};

// Type definition
// -----------------
//

Supplement.type = {
  "id": "supplement",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "caption": "caption", // contains the doi
  }
};


// This is used for the auto-generated docs
// -----------------
//

Supplement.description = {
  "name": "Supplement",
  "remarks": [
    "A Supplement entity.",
  ],
  "properties": {
    "source_id": "Supplement id as it occurs in the source NLM file",
    "label": "Supplement label",
    "caption": "References a caption node, that has all the content",
    "url": "URL of downloadable file"
  }
};

// Example Supplement
// -----------------
//

Supplement.example = {
  "id": "supplement_1",
  "source_id": "SD1-data",
  "type": "supplement",
  "label": "Supplementary file 1.",
  "url": "http://myserver.com/myfile.pdf",
  "caption": "caption_supplement_1"
};


Supplement.Prototype = function() {

  this.getNodes = function() {
    var nodes = [];
    if (this.properties.caption) {
      nodes.push(this.properties.caption);
    }
    return nodes;
  };

  this.getCaption = function() {
    if (this.properties.caption) {
      return this.document.get(this.properties.caption);
    } else {
      return null;
    }
  };
};

Supplement.Prototype.prototype = Document.Composite.prototype;
Supplement.prototype = new Supplement.Prototype();
Supplement.prototype.constructor = Supplement;

// Generate getters
// --------

var getters = {};

_.each(Supplement.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});

// Get the header for resource header display
// --------

getters["header"] = {
  get: function() {
    return this.properties.label;
  }
};


Object.defineProperties(Supplement.prototype, getters);

module.exports = Supplement;

},{"substance-document":68,"underscore":139}],38:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var CompositeView = require("../composite").View;
var $$ = require("substance-application").$$;

// Lens.Supplement.View
// ==========================================================================

var SupplementView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node supplement");
};

SupplementView.Prototype = function() {

  // Render it
  // --------

  this.render = function() {
    var node = this.node;

    this.content = $$('div.content');

    var caption = node.getCaption();
    if (caption) {
      var captionView = this.viewFactory.createView(caption);
      var captionEl = captionView.render().el;
      this.content.appendChild(captionEl);
      this.childrenViews.push(captionView);
    }

    var file = $$('div.file', {
      children: [
        $$('a', {href: node.url, html: '<i class="icon-download-alt"/> Download' })
      ]
    });

    this.content.appendChild(file);
    this.el.appendChild(this.content);

    return this;
  }
};

SupplementView.Prototype.prototype = CompositeView.prototype;
SupplementView.prototype = new SupplementView.Prototype();
SupplementView.prototype.constructor = SupplementView;

module.exports = SupplementView;

},{"../composite":16,"substance-application":57,"substance-util":134,"underscore":139}],39:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./table'),
  View: require('./table_view')
};

},{"./table":40,"./table_view":41}],40:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Lens.Table
// -----------------
//

var Table = function(node, doc) {
  Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Table.type = {
  "id": "table",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "content": "string",
    "footers": ["array", "string"],
    "caption": "caption"
  }
};

Table.config = {
  "zoomable": true
};


// This is used for the auto-generated docs
// -----------------
//

Table.description = {
  "name": "Table",
  "remarks": [
    "A table figure which is expressed in HTML notation"
  ],
  "properties": {
    "source_id": "string",
    "label": "Label shown in the resource header.",
    "title": "Full table title",
    "content": "HTML data",
    "footers": "Table footers expressed as an array strings",
    "caption": "References a caption node, that has all the content"
  }
};


// Example Table
// -----------------
//

Table.example = {
  "id": "table_1",
  "type": "table",
  "label": "Table 1.",
  "title": "Lorem ipsum table",
  "content": "<table>...</table>",
  "footers": [],
  "caption": "caption_1"
};

Table.Prototype = function() {
  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };
};

Table.Prototype.prototype = Node.prototype;
Table.prototype = new Table.Prototype();
Table.prototype.constructor = Table;


// Generate getters
// --------

var getters = {
  header: {
    get: function() {
      return this.properties.label;
    }
  }
};

_.each(Table.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});

Object.defineProperties(Table.prototype, getters);

module.exports = Table;

},{"substance-document":68,"underscore":139}],41:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;

// Substance.Paragraph.View
// ==========================================================================

var TableView = function(node, viewFactory) {
  NodeView.call(this, node);
  this.viewFactory = viewFactory;

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node table");
};

TableView.Prototype = function() {

  //   <% if (node.url) { %>
  //     <div class="table-image">
  //       <a href="<%= node.large_url %>" target="_new"><img class="thumbnail" src="<%= node.url %>"/></a>
  //     </div>
  //   <% } %>
  //   <div class="table-wrapper">
  //     <%= node.content %>
  //   </div>
  //   <div class="footers">
  //     <% _.each(node.footers, function(f) { %>
  //       <div class="footer"><b><%= annotate(f, 'label') %></b> <%= annotate(f, 'content') %></div>
  //     <% }); %>
  //   </div>
  //   <div class="title"><%= annotate(node.caption, 'title') %></div>
  //   <div class="descr"><%= annotate(node.caption, 'content') %></div>
  //   <% if (node.doi) { %>
  //     <div class="doi"><b>DOI:</b> <a href="<%= node.doi %>" target="_new"><%= node.doi %></a></div>
  //   <% } %>
  // </div>

  // .content
  //   .table-wrapper
  //     <table>...
  //   .footers
  //   .title
  //   .caption
  //   .doi

  this.render = function() {
    var node = this.node;
    NodeView.prototype.render.call(this);

    // The actual content
    // --------
    //

    var tableWrapper = $$('.table-wrapper', {
      html: node.content // HTML table content
    });

    this.content.appendChild(tableWrapper);

    // Display footers (optional)
    // --------
    //

    var footers = $$('.footers', {
      children: _.map(node.footers, function(footer) {
        return $$('.footer', { html: "<b>"+footer.label+"</b> " + footer.content });
      })
    });

    // Display caption


    var caption = this.node.getCaption();
    if (caption) {
      var captionView = this.viewFactory.createView(caption);
      var captionEl = captionView.render().el;
      this.content.appendChild(captionEl);
      // this.childrenViews.push(captionView);
    }

    this.content.appendChild(footers);


    // this.content.appendChild($$('.not-yet-implemented', {text: "This node type has not yet been implemented. "}));
    return this;
  }
};

TableView.Prototype.prototype = NodeView.prototype;
TableView.prototype = new TableView.Prototype();

module.exports = TableView;

},{"../node":31,"substance-application":57,"substance-util":134,"underscore":139}],42:[function(require,module,exports){
"use strict";

// HACK: Substance TextView as of the version that is used here
// does not give enough control over the annotation process.
// This matter is an issue which is currently addressed and will be rolled out soon.
// Until then we monkey patch the TextView.
// This needs to be done as other node types (e.g., Headings) are derived from that.

var SubstanceNodes = require("substance-nodes");
var LensText = SubstanceNodes["text"];
var monkeyPatch = require("./text_view_patch");
monkeyPatch(LensText.View);

module.exports = LensText;

},{"./text_view_patch":43,"substance-nodes":79}],43:[function(require,module,exports){
var Document = require("substance-document");
var Annotator = Document.Annotator;
var $$ = require("substance-application").$$;

var _levels = {
  link: 1,
  cross_reference: 1,
  figure_reference: 1,
  person_reference: 1,
  contributor_reference: 1,
  citation_reference: 1,
  strong: 2,
  emphasis: 2,
  code: 2,
  subscript: 2,
  superscript: 2,
  underline: 2,
  author_callout: 3
};

var createAnnotationElement = function(entry) {
  var el;
  if (entry.type === "link") {
    el = $$('a.annotation.'+entry.type, {
      id: entry.id,
      href: this.node.document.get(entry.id).url // "http://zive.at"
    });
  } else if (entry.type === "author_callout") {
    var callout = this.node.document.get(entry.id);
    el = $$('span.annotation.'+callout.style, {
      id: entry.id
    });
  } else {
    el = $$('span.annotation.'+entry.type, {
      id: entry.id
    });
  }
  return el;
};

var renderWithAnnotations = function(annotations) {
  var that = this;
  var text = this.node.content;
  var fragment = document.createDocumentFragment();

  // this splits the text and annotations into smaller pieces
  // which is necessary to generate proper HTML.
  var fragmenter = new Annotator.Fragmenter({levels: _levels});

  fragmenter.onText = function(context, text) {
    context.appendChild(document.createTextNode(text));
  };

  fragmenter.onEnter = function(entry, parentContext) {
    var el = that.createAnnotationElement(entry);
    parentContext.appendChild(el);
    return el;
  };

  // this calls onText and onEnter in turns...
  fragmenter.start(fragment, text, annotations);

  // set the content
  this.content.innerHTML = "";
  this.content.appendChild(fragment);
};

function monkeyPatchSubstanceTextView(TextView) {
  TextView.prototype.createAnnotationElement = createAnnotationElement;
  TextView.prototype.renderWithAnnotations = renderWithAnnotations;
}

module.exports = monkeyPatchSubstanceTextView;

},{"substance-application":57,"substance-document":68}],44:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./video'),
  View: require('./video_view')
};

},{"./video":45,"./video_view":46}],45:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Lens.Video
// -----------------
//

var Video = function(node, doc) {
  Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Video.type = {
  "id": "video",

  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "url_webm": "string",
    "url_ogv": "string",
    "caption": "caption",
    "poster": "string"
  }
};


Video.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Video.description = {
  "name": "Video",
  "remarks": [
    "A video type intended to refer to video resources.",
    "MP4, WebM and OGV formats are supported."
  ],
  "properties": {
    "label": "Label shown in the resource header.",
    "url": "URL to mp4 version of the video.",
    "url_webm": "URL to WebM version of the video.",
    "url_ogv": "URL to OGV version of the video.",
    "poster": "Video poster image.",
    "caption": "References a caption node, that has all the content"
  }
};

// Example Video
// -----------------
//

Video.example = {
  "id": "video_1",
  "type": "video",
  "label": "Video 1.",
  "url": "http://cdn.elifesciences.org/video/eLifeLensIntro2.mp4",
  "url_webm": "http://cdn.elifesciences.org/video/eLifeLensIntro2.webm",
  "url_ogv": "http://cdn.elifesciences.org/video/eLifeLensIntro2.ogv",
  "poster": "http://cdn.elifesciences.org/video/eLifeLensIntro2.png",
  // "doi": "http://dx.doi.org/10.7554/Fake.doi.003",
  "caption": "caption_25"
};

Video.Prototype = function() {

};

Video.Prototype.prototype = Node.prototype;
Video.prototype = new Video.Prototype();
Video.prototype.constructor = Video;


// Generate getters
// --------

var getters = {};

_.each(Video.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});


Object.defineProperties(Video.prototype, _.extend(getters, {
  header: {
    get: function() {
      return this.properties.label;
    }
  },
  caption: {
    get: function() {
      // HACK: this is not yet a real solution
      if (this.properties.caption) {
        return this.document.get(this.properties.caption);
      } else {
        return "";
      }
    }
  }
}));

module.exports = Video;

},{"substance-document":68,"underscore":139}],46:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;

// Lens.Video.View
// ==========================================================================

var VideoView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node video");
};



VideoView.Prototype = function() {

  // Render it
  // --------
  //
  // .content
  //   video
  //     source
  //   .title
  //   .caption
  //   .doi

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Enrich with video content
    // --------
    //

    var node = this.node;

    // The actual video
    // --------
    //

    var sources = [
      $$('source', {
        src: node.url,
        type: "video/mp4; codecs=&quot;avc1.42E01E, mp4a.40.2&quot;",
      })
    ];

    if (node.url_ogv) {
      sources.push($$('source', {
        src: node.url_ogv,
        type: "video/ogg; codecs=&quot;theora, vorbis&quot;",
      }));
    }

    if (node.url_webm) {
      sources.push($$('source', {
        src: node.url_webm,
        type: "video/webm; codecs=&quot;vp8, vorbis%quot;",
      }));
    }

    var video = $$('.video-wrapper', {
      children: [
        $$('video', {
          controls: "controls",
          poster: node.poster,
          preload: "none",
          // style: "background-color: black",
          children: sources
        })
      ]
    });

    this.content.appendChild(video);

    // The video title
    // --------
    //

    if (node.title) {
      this.content.appendChild($$('.title', {
        text: node.title
      }));
    }

    // Add caption if there is any
    if (this.node.caption) {
      var caption = this.viewFactory.createView(this.node.caption);
      this.content.appendChild(caption.render().el);
      this.captionView = caption;
    }

    // Add DOI link if available
    // --------
    //

    if (node.doi) {
      this.content.appendChild($$('.doi', {
        children: [
          $$('b', {text: "DOI: "}),
          $$('a', {href: node.doi, target: "_new", text: node.doi})
        ]
      }));
    }

    return this;
  }
};

VideoView.Prototype.prototype = NodeView.prototype;
VideoView.prototype = new VideoView.Prototype();

module.exports = VideoView;

},{"../node":31,"substance-application":57,"substance-util":134,"underscore":139}],47:[function(require,module,exports){
"use strict";
var SubstanceNodes = require("substance-nodes");

module.exports = SubstanceNodes["webresource"];

},{"substance-nodes":79}],48:[function(require,module,exports){
"use strict";

var LensConverter = require("./src/lens_converter");

module.exports = LensConverter;

},{"./src/lens_converter":54}],49:[function(require,module,exports){
var _ = require('underscore');


var DefaultConfiguration = function() {

};

DefaultConfiguration.Prototype = function() {

  this.enhanceSupplement = function(state, node, element) {
    // Noop - override in your configuration
  };

  this.enhanceTable = function(state, node, element) {
    // Noop - override in your configuration
  };

  this.enhanceCover = function(state, node, element) {
    // Noop - override in your configuration
  };

  // Get baseURL either from XML or from the converter options
  // --------
  // 

  this.getBaseURL = function(state) {
    // Use xml:base attribute if present
    var baseURL = state.xmlDoc.querySelector("article").getAttribute("xml:base");
    return baseURL || state.options.baseURL;
  };

  // Default video resolver
  // --------
  // 

  this.enhanceVideo = function(state, node, element) {
    var el = element.querySelector("media") || element;
    // xlink:href example: elife00778v001.mov
    
    var url = element.getAttribute("xlink:href");
    // Just return absolute urls
    if (url.match(/http:/)) {
      var lastdotIdx = url.lastIndexOf(".");
      var name = url.substring(0, lastdotIdx);
      node.url = name+".mp4";
      node.url_ogv = name+".ogv";
      node.url_webm = name+".webm";
      node.poster = name+".png";
      return;
    } else {
      var baseURL = this.getBaseURL(state);
      var name = url.split(".")[0];
      node.url = baseURL+name+".mp4";
      node.url_ogv = baseURL+name+".ogv";
      node.url_webm = baseURL+name+".webm";
      node.poster = baseURL+name+".png";
    }
  };

  // Implements resolving of relative urls
  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");
    node.url = this.resolveURL(state, url);
  };

  this.enhanceArticle = function(converter, state, article) {
    // Noop - override in your configuration
  };

  this.extractPublicationInfo = function() {
    // Noop - override in your configuration
  };

  this.resolveURL = function(url) {
    return url;
  };

  // Default figure url resolver
  // --------
  // 
  // For relative urls it uses the same basebath as the source XML

  this.resolveURL = function(state, url) {
    // Just return absolute urls
    if (url.match(/http:/)) return url;
    return [
      state.options.baseURL,
      url
    ].join('');
  };
};

DefaultConfiguration.prototype = new DefaultConfiguration.Prototype();
module.exports = DefaultConfiguration;

},{"underscore":139}],50:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var _ = require("underscore");
var DefaultConfiguration = require('./default');

var ElifeConfiguration = function() {

};

ElifeConfiguration.Prototype = function() {

  this.enhanceCover = function(state, node, element) {
    var dispChannel = element.querySelector("subj-group[subj-group-type=display-channel] subject").textContent;
    try {
      var category = element.querySelector("subj-group[subj-group-type=heading] subject").textContent;
    } catch(err) {
      var category = null;
    }
    
    node.breadcrumbs = [
      { name: "eLife", url: "http://elife.elifesciences.org/", image: "http://lens.elifesciences.org/lens-elife/styles/elife.png" },
      { name: dispChannel, url: "http://elife.elifesciences.org/category/"+dispChannel.replace(/ /g, '-').toLowerCase() },
    ];
    
    if (category) node.breadcrumbs.push( { name: category, url: "http://elife.elifesciences.org/category/"+category.replace(/ /g, '-').toLowerCase() } );
  };

  // Resolves figure url
  // --------
  //

  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");
    node.url = this.resolveURL(state, url);
  };

  this.enhanceVideo = function(state, node, element) {
    var el = element.querySelector("media") || element;
    var href = element.getAttribute("xlink:href").split(".");
    var name = href[0];

    node.url = "http://static.movie-usa.glencoesoftware.com/mp4/10.7554/"+name+".mp4";
    node.url_ogv = "http://static.movie-usa.glencoesoftware.com/ogv/10.7554/"+name+".ogv";
    node.url_webm = "http://static.movie-usa.glencoesoftware.com/webm/10.7554/"+name+".webm";
    node.poster = "http://static.movie-usa.glencoesoftware.com/jpg/10.7554/"+name+".jpg";
  };

  // Example url to JPG: http://cdn.elifesciences.org/elife-articles/00768/svg/elife00768f001.jpg
  this.resolveURL = function(state, url) {
    // Use absolute URL
    if (url.match(/http:\/\//)) return url;

    // Look up base url
    var baseURL = this.getBaseURL(state);
    
    if (baseURL) {
      return [baseURL, url].join('');
    } else {
      // Use special URL resolving for production articles
      return [
        "http://cdn.elifesciences.org/elife-articles/",
        state.doc.id,
        "/jpg/",
        url,
        ".jpg"
      ].join('');
    }

  };

  this.enhanceSupplement = function(state, node, element) {
    var baseURL = this.getBaseURL(state);
    if (baseURL) {
      return [baseURL, node.url].join('');
    } else {
      node.url = [
        "http://cdn.elifesciences.org/elife-articles/",
        state.doc.id,
        "/suppl/",
        node.url
      ].join('');
    }
  };

  this.extractPublicationInfo = function(converter, state, article) {
    var doc = state.doc;

    var articleMeta = article.querySelector("article-meta");

    function _extractDate(dateEl) {
      if (!dateEl) return null;
      var day = dateEl.querySelector("day").textContent;
      var month = dateEl.querySelector("month").textContent;
      var year = dateEl.querySelector("year").textContent;
      return [year, month, day].join("-");
    }

    var pubDate = articleMeta.querySelector("pub-date");
    var receivedDate = articleMeta.querySelector("date[date-type=received]");
    var acceptedDate = articleMeta.querySelector("date[date-type=accepted]");

    // Extract keywords
    // ------------
    //
    // <kwd-group kwd-group-type="author-keywords">
    // <title>Author keywords</title>
    // <kwd>innate immunity</kwd>
    // <kwd>histones</kwd>
    // <kwd>lipid droplet</kwd>
    // <kwd>anti-bacterial</kwd>
    // </kwd-group>
    var keyWords = articleMeta.querySelectorAll("kwd-group[kwd-group-type=author-keywords] kwd");

    // Extract research organism
    // ------------
    //

    // <kwd-group kwd-group-type="research-organism">
    // <title>Research organism</title>
    // <kwd>B. subtilis</kwd>
    // <kwd>D. melanogaster</kwd>
    // <kwd>E. coli</kwd>
    // <kwd>Mouse</kwd>
    // </kwd-group>
    var organisms = articleMeta.querySelectorAll("kwd-group[kwd-group-type=research-organism] kwd");

    // Extract subjects
    // ------------
    //
    // <subj-group subj-group-type="heading">
    // <subject>Immunology</subject>
    // </subj-group>
    // <subj-group subj-group-type="heading">
    // <subject>Microbiology and infectious disease</subject>
    // </subj-group>

    var subjects = articleMeta.querySelectorAll("subj-group[subj-group-type=heading] subject");

    // Extract article_type
    // ---------------
    //
    // <subj-group subj-group-type="display-channel">
    // <subject>Research article</subject>
    // </subj-group>

    var articleType = articleMeta.querySelector("subj-group[subj-group-type=display-channel] subject");

    // Extract journal title
    // ---------------
    //

    var journalTitle = article.querySelector("journal-title");

    // <article-id pub-id-type="doi">10.7554/eLife.00003</article-id>
    var articleDOI = article.querySelector("article-id[pub-id-type=doi]");


    // Extract PDF link
    // ---------------
    //
    // <self-uri content-type="pdf" xlink:href="elife00007.pdf"/>
    
    var pdfURI = article.querySelector("self-uri[content-type=pdf]");    

    var pdfLink = [
      "http://cdn.elifesciences.org/elife-articles/",
      state.doc.id,
      "/pdf/",
      pdfURI ? pdfURI.getAttribute("xlink:href") : "#"
    ].join('');


    // Related article if exists
    // -----------

    var relatedArticle = article.querySelector("related-article");


    // if (relatedArticle) relatedArticle = relatedArticle.getAttribute("xlink:href");

    // Create PublicationInfo node
    // ---------------
    
    var pubInfoNode = {
      "id": "publication_info",
      "type": "publication_info",
      "published_on": _extractDate(pubDate),
      "received_on": _extractDate(receivedDate),
      "accepted_on": _extractDate(acceptedDate),
      "keywords": _.pluck(keyWords, "textContent"),
      "research_organisms": _.pluck(organisms, "textContent"),
      "subjects": _.pluck(subjects, "textContent"),
      "article_type": articleType ? articleType.textContent : "",
      "journal": journalTitle ? journalTitle.textContent : "",
      "pdf_link": pdfLink,
      "related_article": relatedArticle ? ["http://dx.doi.org/", relatedArticle.getAttribute("xlink:href")].join("") : "",
      "xml_link": "https://s3.amazonaws.com/elife-cdn/elife-articles/"+state.doc.id+"/elife"+state.doc.id+".xml", // "http://mickey.com/mouse.xml",
      "json_link": "http://mickey.com/mouse.json",
      "doi": articleDOI ? ["http://dx.doi.org/", articleDOI.textContent].join("") : "",
    };

    doc.create(pubInfoNode);
    doc.show("info", pubInfoNode.id, 0);
  };


  // Add additional information to the info view
  // ---------
  //
  // Impact
  // Reviewing Editor
  // Major datasets
  // Acknowledgements
  // Copyright

  this.enhanceInfo = function(converter, state, article) {
    var doc = state.doc;

    // Initialize the Article Info object
    var articleInfo = {
      "id": "articleinfo",
      "type": "paragraph",
      "children": []
    };
    var nodes = articleInfo.children;

    // Get the author's impact statement
    var meta = article.querySelectorAll("meta-value");
    var impact = meta[1];
    
    if (impact) {
      var h1 = {
        "type": "heading",
        "id": state.nextId("heading"),
        "level": 3,
        "content": "Impact",
      };
      doc.create(h1);
      nodes.push(h1.id);

      var par = converter.paragraphGroup(state, impact);
      nodes.push(par[0].id);
    }

    // Get reviewing editor
    // --------------

    var editor = article.querySelector("contrib[contrib-type=editor]");

    if (editor) {
      var name = converter.getName(editor.querySelector('name'));
      var inst = editor.querySelector("institution").textContent;
      var role = editor.querySelector("role").textContent;
      var country = editor.querySelector("country").textContent;

      var h1 = {
        "type": "heading",
        "id": state.nextId("heading"),
        "level": 3,
        "content": "Reviewing Editor"
      };
      
      doc.create(h1);
      nodes.push(h1.id);

      var t1 = {
        "type": "text",
        "id": state.nextId("text"),
        "content": [name, role, inst, country].join(", ")
      };

      doc.create(t1);
      nodes.push(t1.id);      
    }

    // Get major datasets

    var datasets = article.querySelectorAll('sec');

    for (var i = 0;i <datasets.length;i++){
      var data = datasets[i];
      var type = data.getAttribute('sec-type');
      if (type === 'datasets') {
        var h1 = {
          "type" : "heading",
          "id" : state.nextId("heading"),
          "level" : 3,
          "content" : "Major Datasets"
        };
        doc.create(h1);
        nodes.push(h1.id);
        var ids = converter.datasets(state, util.dom.getChildren(data));
        for (var j=0;j < ids.length;j++) {
          if (ids[j]) {
            nodes.push(ids[j]);
          }
        }
      }
    }

    // Get acknowledgements

    var ack = article.querySelector("ack");
    if (ack) {
      var h1 = {
        "type" : "heading",
        "id" : state.nextId("heading"),
        "level" : 3,
        "content" : "Acknowledgements"
      };
      doc.create(h1);
      nodes.push(h1.id);
      var par = converter.bodyNodes(state, util.dom.getChildren(ack));
      nodes.push(par[0].id);
    }
    
    // Get copyright and license information
    var license = article.querySelector("permissions");
    if (license) {
      var h1 = {
        "type" : "heading",
        "id" : state.nextId("heading"),
        "level" : 3,
        "content" : "Copyright and License"
      };
      doc.create(h1);
      nodes.push(h1.id);

      var copyright = license.querySelector("copyright-statement");
      if (copyright) {
        var par = converter.paragraphGroup(state, copyright);
        var textid = par[0].children[0];
        doc.nodes[textid].content += ". ";
        nodes.push(par[0].id);
      }
      var lic = license.querySelector("license");
      var children = util.dom.getChildren(lic);
      for (var i = 0;i < children.length;i++) {
        var child = children[i];
        var type = util.dom.getNodeType(child);
        if (type === 'p' || type === 'license-p') {
          var par = converter.paragraphGroup(state, child);
          nodes.push(par[0].id)
        }
      }
    }
    
    doc.create(articleInfo);
    doc.show("info", articleInfo.id);
  };

  // Add Decision letter and author response
  // ---------

  this.enhanceArticle = function(converter, state, article) {

    var nodes = [];

    // Decision letter (if available)
    // -----------

    var articleCommentary = article.querySelector("#SA1");
    if (articleCommentary) {

      var heading = {
        id: state.nextId("heading"),
        type: "heading",
        level: 1,
        content: "Article Commentary"
      };
      doc.create(heading);
      nodes.push(heading);

      var heading = {
        id: state.nextId("heading"),
        type: "heading",
        level: 2,
        content: "Decision letter"
      };
      doc.create(heading);
      nodes.push(heading);

      var body = articleCommentary.querySelector("body");
      nodes = nodes.concat(converter.bodyNodes(state, util.dom.getChildren(body)));
    }

    // Author response
    // -----------

    var authorResponse = article.querySelector("#SA2");
    if (authorResponse) {

      var heading = {
        id: state.nextId("heading"),
        type: "heading",
        level: 2,
        content: "Author response"
      };
      doc.create(heading);
      nodes.push(heading);

      var body = authorResponse.querySelector("body");
      nodes = nodes.concat(converter.bodyNodes(state, util.dom.getChildren(body)));
    }

    // Show them off
    // ----------

    if (nodes.length > 0) {
      converter.show(state, nodes);
    }

    this.enhanceInfo(converter, state, article);
  };
};

ElifeConfiguration.Prototype.prototype = DefaultConfiguration.prototype;
ElifeConfiguration.prototype = new ElifeConfiguration.Prototype();
ElifeConfiguration.prototype.constructor = ElifeConfiguration;

module.exports = ElifeConfiguration;

},{"./default":49,"substance-util":134,"underscore":139}],51:[function(require,module,exports){
var DefaultConfiguration = require('./default');

var LandesConfiguration = function() {

};

LandesConfiguration.Prototype = function() {

  var mappings = {
    "CC": "cc",
    "INTV": "intravital",
    "CIB": "cib"
  };        

  var __super__ = DefaultConfiguration.prototype;

  // Provide proper url for supplement
  // --------
  // 

  this.enhanceSupplement = function(state, node, element) {
    var el = element.querySelector("graphic, media") || element;
    var url = el.getAttribute("xlink:href");

    var publisherId = state.xmlDoc.querySelector('journal-id').textContent;

    var url = [
      "https://www.landesbioscience.com/journals/",
      mappings[publisherId],
      "/",
      url,
    ].join('');

    node.url = url;
  };

  // Yield proper video urls
  // --------
  // 

  this.enhanceVideo = function(state, node, element) {
    node.url = "provide_url_here";
  };

  // Customized labels
  // -------

  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");
    var publisherId = state.xmlDoc.querySelector('journal-id').textContent;

    var url = [
      "https://www.landesbioscience.com/article_figure/journals/",
      mappings[publisherId],
      "/",
      url,
    ].join('');

    node.url = url;

    if(!node.label) {
      var type = node.type;
      node.label = type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
};


LandesConfiguration.Prototype.prototype = DefaultConfiguration.prototype;
LandesConfiguration.prototype = new LandesConfiguration.Prototype();
LandesConfiguration.prototype.constructor = LandesConfiguration;

module.exports = LandesConfiguration;

},{"./default":49}],52:[function(require,module,exports){
var DefaultConfiguration = require('./default');

var PeerJConfiguration = function() {

};

PeerJConfiguration.Prototype = function() {

  // Resolve figure urls
  // --------
  // 

  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");

    node.url = url;
  };

  // Assign video url
  // --------
  // 

  this.enhanceVideo = function(state, node, element) {
    node.url = "http://mickey.com/mouse.mp4";
  };
};


PeerJConfiguration.Prototype.prototype = DefaultConfiguration.prototype;
PeerJConfiguration.prototype = new PeerJConfiguration.Prototype();
PeerJConfiguration.prototype.constructor = PeerJConfiguration;

module.exports = PeerJConfiguration;

},{"./default":49}],53:[function(require,module,exports){
var DefaultConfiguration = require('./default');

var PLOSConfiguration = function() {

};

PLOSConfiguration.Prototype = function() {

  // Resolve figure urls
  // --------
  // 

  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");

    url = [
      "http://www.plosone.org/article/fetchObject.action?uri=",
      url,
      "&representation=PNG_L"
    ].join('');

    node.url = url;
  };

  // Assign video url
  // --------
  // 

  this.enhanceVideo = function(state, node, element) {
    node.url = "http://mickey.com/mouse.mp4";
  };
};


PLOSConfiguration.Prototype.prototype = DefaultConfiguration.prototype;
PLOSConfiguration.prototype = new PLOSConfiguration.Prototype();
PLOSConfiguration.prototype.constructor = PLOSConfiguration;

module.exports = PLOSConfiguration;

},{"./default":49}],54:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;
var ImporterError = errors.define("ImporterError");

// Available configurations
// --------

var ElifeConfiguration = require("./configurations/elife");
var LandesConfiguration = require("./configurations/landes");
var DefaultConfiguration = require("./configurations/default");
var PLOSConfiguration = require("./configurations/plos");
var PeerJConfiguration = require("./configurations/peerj");



var LensImporter = function(options) {
  this.options = options || {};
};

LensImporter.Prototype = function() {

  // Helpers
  // --------

  var _getName = function(nameEl) {
    if (!nameEl) return "N/A";
    var names = [];

    var surnameEl = nameEl.querySelector("surname");
    var givenNamesEl = nameEl.querySelector("given-names");
    var suffix = nameEl.querySelector("suffix");

    if (givenNamesEl) names.push(givenNamesEl.textContent);
    if (surnameEl) names.push(surnameEl.textContent);
    if (suffix) return [names.join(" "), suffix.textContent].join(", ");

    return names.join(" ");
  };

  // Expose getName helper to public API
  this.getName = _getName;

  var _toHtml = function(el) {
    var tmp = document.createElement("DIV");
    tmp.appendChild(el.cloneNode(true));
    return tmp.innerHTML;
  };

  // ### The main entry point for starting an import
  // options:
  //   - TRIM_WHITESPACES : eliminates any succeeding white-spaces; Use this to prettify the output for
  //     prettified XML containing indentation for readability. (Default: undefined)

  this.import = function(input, options) {
    var xmlDoc;

    // Note: when we are using jqueries get("<file>.xml") we
    // magically get a parsed XML document already
    if (_.isString(input)) {
      var parser = new DOMParser();
      xmlDoc = parser.parseFromString(input,"text/xml");
    } else {
      xmlDoc = input;
    }

    // Creating the output Document via factore, so that it is possible to
    // create specialized NLMImporter later which would want to instantiate
    // a specialized Document type
    var doc = this.createDocument();

    // For debug purposes
    window.doc = doc;

    // A deliverable state which makes this importer stateless
    var state = new LensImporter.State(xmlDoc, doc, options);

    // Note: all other methods are called corresponding
    return this.document(state, xmlDoc);
  };

  // Overridden to create a Lens Article instance
  this.createDocument = function() {
    var Article = require("lens-article");
    var doc = new Article();
    return doc;
  };

  var _viewMapping = {
    // "image": "figures",
    "box": "content",
    "supplement": "figures",
    "figure": "figures",
    "table": "figures",
    "video": "figures"
  };

  this.show = function(state, nodes) {
    var doc = state.doc;

    _.each(nodes, function(n) {
      var view = _viewMapping[n.type] || "content";
      doc.show(view, n.id);
    });
  };


  this.extractCover = function(state, article) {
    var doc = state.doc;
    var docNode = doc.get("document");
    var cover = {
      id: "cover",
      type: "cover",
      title: docNode.title,
      authors: [], // docNode.authors,
      abstract: docNode.abstract
    };

    // Create authors paragraph that has contributor_reference annotations
    // to activate the author cards

    _.each(docNode.authors, function(contributorId) {
      var contributor = doc.get(contributorId);

      var authorsPara = {
        "id": "text_"+contributorId+"_reference",
        "type": "text",
        "content": contributor.name
      };

      doc.create(authorsPara);
      cover.authors.push(authorsPara.id);

      var anno = {
        id: state.nextId("contributor_reference"),
        type: "contributor_reference",
        path: ["text_" + contributorId + "_reference", "content"],
        range: [0, contributor.name.length],
        target: contributorId
      };

      doc.create(anno);
    }, this);

    // Move to elife configuration
    // -------------------
    // <article-categories>
    // <subj-group subj-group-type="display-channel">...</subj-group>
    // <subj-group subj-group-type="heading">...</subj-group>
    // </article-categories>

    // <article-categories>
    //   <subj-group subj-group-type="display-channel">
    //     <subject>Research article</subject>
    //   </subj-group>
    //   <subj-group subj-group-type="heading">
    //     <subject>Biophysics and structural biology</subject>
    //   </subj-group>
    // </article-categories>

    state.config.enhanceCover(state, cover, article);

    doc.create(cover);
    doc.show("content", cover.id, 0);
  };

  // Note: Substance.Article supports only one author.
  // We use the first author found in the contribGroup for the 'creator' property.
  this.contribGroup = function(state, contribGroup) {
    var i;
    var affiliations = contribGroup.querySelectorAll("aff");

    for (i = 0; i < affiliations.length; i++) {
      this.affiliation(state, affiliations[i]);
    }

    var contribs = contribGroup.querySelectorAll("contrib");
    for (i = 0; i < contribs.length; i++) {
      this.contributor(state, contribs[i]);
    }

    // Extract on-behalf-of element and stick it to the document
    var doc = state.doc;
    var onBehalfOf = contribGroup.querySelector("on-behalf-of");
    if (onBehalfOf) doc.on_behalf_of = onBehalfOf.textContent.trim();
  };

  this.affiliation = function(state, aff) {
    var doc = state.doc;

    var institution = aff.querySelector("institution");
    var country = aff.querySelector("country");
    var label = aff.querySelector("label");
    var department = aff.querySelector("addr-line named-content[content-type=department]");
    var city = aff.querySelector("addr-line named-content[content-type=city]");

    var affiliationNode = {
      id: state.nextId("affiliation"),
      type: "affiliation",
      source_id: aff.getAttribute("id"),
      label: label ? label.textContent : null,
      department: department ? department.textContent : null,
      city: city ? city.textContent : null,
      institution: institution ? institution.textContent : null,
      country: country ? country.textContent: null
    };
    doc.create(affiliationNode);
  };



  this.contributor = function(state, contrib) {
    var doc = state.doc;

    var id = state.nextId("contributor");
    var contribNode = {
      id: id,
      source_id: contrib.getAttribute("id"),
      type: "contributor",
      name: "",
      affiliations: [],
      fundings: [],
      // Not yet supported... need examples
      image: "",
      deceased: false,
      emails: [],
      contribution: "",
      members: []
    };

    // Deceased?

    if (contrib.getAttribute("deceased") === "yes") {
      contribNode.deceased = true;
    }

    // Extract ORCID
    // -----------------
    // 
    // <uri content-type="orcid" xlink:href="http://orcid.org/0000-0002-7361-560X"/>

    var orcidURI = contrib.querySelector("uri[content-type=orcid]");
    if (orcidURI) {
      contribNode.orcid = orcidURI.getAttribute("xlink:href");
    }

    // Extracting equal contributions
    var nameEl = contrib.querySelector("name");
    if (nameEl) {
      contribNode.name = _getName(nameEl);
    } else {
      var collab = contrib.querySelector("collab");
      // Assuming this is an author group
      if (collab) {
        contribNode.name = collab.textContent;
      } else {
        contribNode.name = "N/A";
      }


      // Extract member list for person group
      // eLife specific?
      // ----------------

      var memberListId = contrib.querySelector("xref[ref-type=other]").getAttribute("rid");
      var members = state.xmlDoc.querySelectorAll("#"+memberListId+" contrib");
      
      contribNode.members = _.map(members, function(m) {
        return _getName(m.querySelector("name"));
      });
    }


    function _getEqualContribs(contribId) {
      var result = [];
      var refs = state.xmlDoc.querySelectorAll("xref[rid="+contribId+"]");

      // Find xrefs within contrib elements
      _.each(refs, function(ref) {
        var c = ref.parentNode;
        if (c !== contrib) result.push(_getName(c.querySelector("name")))
      });
      return result;
    };


    // Extract equal contributors
    var equalContribs = [];

    // extract affiliations stored as xrefs
    var xrefs = contrib.querySelectorAll("xref");
    var compInterests = [];
    _.each(xrefs, function(xref) {
      if (xref.getAttribute("ref-type") === "aff") {
        var affId = xref.getAttribute("rid");
        var affNode = doc.getNodeBySourceId(affId);
        if (affNode) {
          contribNode.affiliations.push(affNode.id);
        }
      } else if (xref.getAttribute("ref-type") === "other") {

        var awardGroup = state.xmlDoc.getElementById(xref.getAttribute("rid"));
        if (!awardGroup) return;

        var fundingSource = awardGroup.querySelector("funding-source");
        if (!fundingSource) return;

        var awardId = awardGroup.querySelector("award-id");
        awardId = awardId ? ", "+awardId.textContent : "";


        // Funding source nodes are looking like this
        // 
        // <funding-source>
        //   National Institutes of Health
        //   <named-content content-type="funder-id">http://dx.doi.org/10.13039/100000002</named-content>
        // </funding-source>
        // 
        // and we only want to display the first text node, excluding the funder id

        var fundingSourceName = fundingSource.childNodes[0].textContent;

        contribNode.fundings.push([fundingSourceName, awardId].join(''));
      } else if (xref.getAttribute("ref-type") === "corresp") {
        var corresp = state.xmlDoc.getElementById(xref.getAttribute("rid"));
        if (!corresp) return;
        var email = corresp.querySelector("email");
        if (!email) return;
        contribNode.emails.push(email.textContent);
      } else if (xref.getAttribute("ref-type") === "fn") {
        var elem = state.xmlDoc.getElementById(xref.getAttribute("rid"));

        if (elem && elem.getAttribute("fn-type") === "con") {
          contribNode.contribution = elem.textContent;
        } else if (elem && elem.getAttribute("fn-type") === "conflict") {
          // skipping...
          compInterests.push(elem.textContent.trim());
        } else if (elem && elem.getAttribute("fn-type") === "present-address") {
          // Extract present address
          contribNode.present_address = elem.querySelector("p").textContent;
        } else if (elem && elem.getAttribute("fn-type") === "equal") {
          // Extract equal contributors
          equalContribs = _getEqualContribs(elem.getAttribute("id"));
        } else if (elem && elem.getAttribute("fn-type") === "other" && elem.getAttribute("id").indexOf("equal-contrib")>=0) {
          // skipping...
          equalContribs = _getEqualContribs(elem.getAttribute("id"));
        } else {
          // skipping...
        }
      }
    });

    contribNode.equal_contrib = equalContribs;

    // HACK: if author is assigned a conflict, remove the redundant
    // conflict entry "The authors have no competing interests to declare"
    // This is a data-modelling problem on the end of our input XML
    // so we need to be smart about it in the converter

    if (compInterests.length > 1) {
      compInterests = _.filter(compInterests, function(confl) {
        return confl.indexOf("no competing") < 0;
      });
    }
    
    contribNode.competing_interests = compInterests;

    if (contrib.getAttribute("contrib-type") === "author") {
      doc.nodes.document.authors.push(id);
    }

    doc.create(contribNode);
    doc.show("info", contribNode.id);
  };

  // Annotations
  // --------

  var _annotationTypes = {
    "bold": "strong",
    "italic": "emphasis",
    "monospace": "code",
    "sub": "subscript",
    "sup": "superscript",
    "underline": "underline",
    "ext-link": "link",
    "xref": "",
    "named-content": ""
  };

  this.isAnnotation = function(type) {
    return _annotationTypes[type] !== undefined;
  };

  var AUTHOR_CALLOUT = /author-callout-style/;

  this.createAnnotation = function(state, el, start, end) {
    var type = el.tagName.toLowerCase();
    var anno = {
      path: _.last(state.stack).path,
      range: [start, end],
    };
    if (type === "xref") {
      var refType = el.getAttribute("ref-type");

      var sourceId = el.getAttribute("rid");
      if (refType === "bibr") {
        anno.type = "citation_reference";
      } else if (refType === "fig" || refType === "table" || refType === "supplementary-material" || refType === "other") {
        anno.type = "figure_reference";
      } else {
        // Treat everything else as cross reference
        anno.type = "cross_reference";
        // console.log("Ignoring xref: ", refType, el);
        // return;
      }

      if (sourceId) anno.target = sourceId.split(" ")[0];
    }
    else if (type === "named-content") {
      var contentType = el.getAttribute("content-type");
      if (AUTHOR_CALLOUT.test(contentType)) {
        anno.type = "author_callout";
        anno.style = contentType;
      } else {
        return;
      }
    }
    // Common annotations (e.g., emphasis)
    else if (_annotationTypes[type] !== undefined) {
      anno.type = _annotationTypes[type];
      if (type === "ext-link") {
        anno.url = el.getAttribute("xlink:href");
        if (el.getAttribute("ext-link-type") === "doi") {
          anno.url = ["http://dx.doi.org/", anno.url].join("");
        }
      }
    }
    else {
      console.log("Ignoring annotation: ", type, el);
      return;
    }

    anno.id = state.nextId(anno.type);
    state.annotations.push(anno);
  };

  this.annotatedText = function(state, iterator, charPos, nested) {
    var plainText = "";

    if (charPos === undefined) {
      charPos = 0;
    }

    while(iterator.hasNext()) {
      var el = iterator.next();
      // Plain text nodes...
      if (el.nodeType === Node.TEXT_NODE) {
        var text = state.acceptText(el.textContent);
        plainText += text;
        charPos += text.length;
      }
      // Annotations...
      else {

        var type = util.dom.getNodeType(el);
        if (this.isAnnotation(type)) {
          var start = charPos;
          // recurse into the annotation element to collect nested annotations
          // and the contained plain text
          var childIterator = new util.dom.ChildNodeIterator(el);
          var annotatedText = this.annotatedText(state, childIterator, charPos, "nested");
          plainText += annotatedText;
          charPos += annotatedText.length;
          if (!state.ignoreAnnotations) {
            this.createAnnotation(state, el, start, charPos);
          }
        }

        // Unsupported...
        else {
          if (nested) {
            throw new ImporterError("Node not yet supported in annoted text: " + type);
          }
          else {
            // on paragraph level other elements can break a text block
            // we shift back the position and finish this call
            iterator.back();
            break;
          }
        }
      }
    }
    return plainText;
  };


  // Parser
  // --------
  // These methods are used to process XML elements in
  // using a recursive-descent approach.


  // ### Top-Level function that takes a full NLM tree
  // Note: a specialized converter can derive this method and
  // add additional pre- or post-processing.

  this.document = function(state, xmlDoc) {
    // Setup configuration objects
    var publisherName = xmlDoc.querySelector("publisher-name").textContent;
    if (publisherName === "Landes Bioscience") {
      state.config = new LandesConfiguration();
    } else if (publisherName === "eLife Sciences Publications, Ltd") {
      state.config = new ElifeConfiguration();
    } else if (publisherName === "Public Library of Science") {
      state.config = new PLOSConfiguration();
    } else if (publisherName === 'PeerJ Inc.') {
      state.config = new PeerJConfiguration();
    } else {
      state.config = new DefaultConfiguration();
    }

    var doc = state.doc;
    var article = xmlDoc.querySelector("article");

    if (!article) {
      throw new ImporterError("Expected to find an 'article' element.");
    }

    // recursive-descent for the main body of the article
    this.article(state, article);

    // post-processing:

    // Creating the annotations afterwards, to make sure
    // that all referenced nodes are available
    for (var i = 0; i < state.annotations.length; i++) {
      var anno = state.annotations[i];
      if (anno.target) {
        var targetNode = state.doc.getNodeBySourceId(anno.target);
        if (targetNode) anno.target = targetNode.id;
      }

      doc.create(state.annotations[i]);
    }

    // Rebuild views to ensure consistency
    _.each(doc.views, function(view) {
      doc.get(view).rebuild();
    });

    return doc;
  };



  this.extractContributors = function(state, article) {
    // TODO: the spec says, that there may be any combination of
    // 'contrib-group', 'aff', 'aff-alternatives', and 'x'
    // However, in the articles seen so far, these were sub-elements of 'contrib-group', which itself was single
    var contribGroup = article.querySelector("article-meta contrib-group");
    if (contribGroup) {
      this.contribGroup(state, contribGroup);
    }
  };


  this.extractFigures = function(state, xmlDoc) {
    // Globally query all figure-ish content, <fig>, <supplementary-material>, <table-wrap>, <media video>
    // mimetype="video"
    var figureElements = xmlDoc.querySelectorAll("fig, table-wrap, supplementary-material, media[mimetype=video]");
    var figureNodes = [];
    var node;

    for (var i = 0; i < figureElements.length; i++) {
      var figEl = figureElements[i];
      var type = util.dom.getNodeType(figEl);

      if (type === "fig") {
        node = this.figure(state, figEl);
        if (node) figureNodes.push(node);
      }
      else if (type === "table-wrap") {
        node = this.tableWrap(state, figEl);
        if (node) figureNodes.push(node);
        // nodes = nodes.concat(this.section(state, child));
      } else if (type === "media") {
        node = this.video(state, figEl);
        if (node) figureNodes.push(node);
      } else if (type === "supplementary-material") {

        node = this.supplement(state, figEl);
        if (node) figureNodes.push(node);
      }
    }

    // Show the figures
    if (figureNodes.length > 0) {
      this.show(state, figureNodes);
    }
  };


  this.extractCitations = function(state, xmlDoc) {
    var refList = xmlDoc.querySelector("ref-list");
    if (refList) {
      this.refList(state, refList);
    }
  };

  // Handle <fig> element
  // --------
  //

  this.figure = function(state, figure) {
    var doc = state.doc;

    var label = figure.querySelector("label");

    // Top level figure node
    var figureNode = {
      "type": "figure",
      "id": state.nextId("figure"),
      "source_id": figure.getAttribute("id"),
      "label": label ? label.textContent : "Figure",
      "url": "http://images.wisegeek.com/young-calico-cat.jpg",
      "caption": null
    };

    // Add a caption if available
    var caption = figure.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) figureNode.caption = captionNode.id;
    }

    var attrib = figure.querySelector("attrib");
    if (attrib) {
      figureNode.attrib = attrib.textContent;
    }

    // Lets the configuration patch the figure node properties
    state.config.enhanceFigure(state, figureNode, figure);
    doc.create(figureNode);

    return figureNode;
  };

  // Handle <supplementary-material> element
  // --------
  //
  // eLife Example:
  //
  // <supplementary-material id="SD1-data">
  //   <object-id pub-id-type="doi">10.7554/eLife.00299.013</object-id>
  //   <label>Supplementary file 1.</label>
  //   <caption>
  //     <title>Compilation of the tables and figures (XLS).</title>
  //     <p>This is a static version of the
  //       <ext-link ext-link-type="uri" xlink:href="http://www.vaxgenomics.org/vaxgenomics/" xmlns:xlink="http://www.w3.org/1999/xlink">
  //         Interactive Results Tool</ext-link>, which is also available to download from Zenodo (see major datasets).</p>
  //     <p>
  //       <bold>DOI:</bold>
  //       <ext-link ext-link-type="doi" xlink:href="10.7554/eLife.00299.013">http://dx.doi.org/10.7554/eLife.00299.013</ext-link>
  //     </p>
  //   </caption>
  //   <media mime-subtype="xlsx" mimetype="application" xlink:href="elife00299s001.xlsx"/>
  // </supplementary-material>
  //
  // LB Example:
  //
  // <supplementary-material id="SUP1" xlink:href="2012INTRAVITAL024R-Sup.pdf">
  //   <label>Additional material</label>
  //   <media xlink:href="2012INTRAVITAL024R-Sup.pdf"/>
  // </supplementary-material>

  this.supplement = function(state, supplement) {
    var doc = state.doc;

    //get supplement info
    var label = supplement.querySelector("label");

    var mediaEl = supplement.querySelector("media");
    var url = mediaEl ? mediaEl.getAttribute("xlink:href") : null;
    var doi = supplement.querySelector("object-id[pub-id-type='doi']");
    doi = doi ? "http://dx.doi.org/" + doi.textContent : "";

    //create supplement node using file ids
    var supplementNode = {
      "id": state.nextId("supplement"),
      "source_id": supplement.getAttribute("id"),
      "type": "supplement",
      "label": label ? label.textContent : "",
      "url": url,
      "caption": null
    };

    // Add a caption if available
    var caption = supplement.querySelector("caption");

    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) supplementNode.caption = captionNode.id;
    }

    // Let config enhance the node
    state.config.enhanceSupplement(state, supplementNode, supplement);
    doc.create(supplementNode);
    return supplementNode;
    // doc.show("figures", id);
  };


  // Used by Figure, Table, Video, Supplement types.
  // --------

  this.caption = function(state, caption) {
    var doc = state.doc;
    var title = caption.querySelector("title");

    // Only consider direct children
    var paragraphs = _.select(caption.querySelectorAll("p"), function(p) {
      return p.parentNode === caption;
    });

    if (paragraphs.length === 0) return null;

    var captionNode = {
      "id": state.nextId("caption"),
      "source_id": caption.getAttribute("id"),
      "type": "caption",
      "title": "",
      "children": []
    };

    // Titles can be annotated, thus delegate to paragraph
    if (title) {
      // Resolve title by delegating to the paragraph
      var node = this.paragraph(state, title);
      if (node) {
        captionNode.title = node.id;
      }
    }


    var children = [];
    _.each(paragraphs, function(p) {
      var node = this.paragraph(state, p);
      if (node) {
        children.push(node.id);
      }
    }, this);

    captionNode.children = children;
    doc.create(captionNode);

    return captionNode;
  };


  // Example video element
  //
  // <media content-type="glencoe play-in-place height-250 width-310" id="movie1" mime-subtype="mov" mimetype="video" xlink:href="elife00005m001.mov">
  //   <object-id pub-id-type="doi">
  //     10.7554/eLife.00005.013</object-id>
  //   <label>Movie 1.</label>
  //   <caption>
  //     <title>Movement of GFP tag.</title>
  //     <p>
  //       <bold>DOI:</bold>
  //       <ext-link ext-link-type="doi" xlink:href="10.7554/eLife.00005.013">http://dx.doi.org/10.7554/eLife.00005.013</ext-link>
  //     </p>
  //   </caption>
  // </media>

  this.video = function(state, video) {
    var doc = state.doc;

    var label = video.querySelector("label").textContent;

    var id = state.nextId("video");
    var videoNode = {
      "id": id,
      "source_id": video.getAttribute("id"),
      "type": "video",
      "label": label,
      "title": "",
      "caption": null,
      "poster": ""
    };

    // Add a caption if available
    var caption = video.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) videoNode.caption = captionNode.id;
    }

    state.config.enhanceVideo(state, videoNode, video);
    doc.create(videoNode);

    return videoNode;
  };

  this.tableWrap = function(state, tableWrap) {
    var doc = state.doc;
    var label = tableWrap.querySelector("label");

    var tableNode = {
      "id": state.nextId("table"),
      "source_id": tableWrap.getAttribute("id"),
      "type": "table",
      "title": "",
      "label": label ? label.textContent : "Table",
      "content": "",
      "caption": null,
      // Not supported yet ... need examples
      footers: [],
      // doi: "" needed?
    };

    // Note: using a DOM div element to create HTML
    var table = tableWrap.querySelector("table");
    tableNode.content = _toHtml(table);

    // Add a caption if available
    var caption = tableWrap.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) tableNode.caption = captionNode.id;
    }

    state.config.enhanceTable(state, tableNode, tableWrap);
    doc.create(tableNode);
    return tableNode;
  };


  // Article
  // --------
  // Does the actual conversion.
  //
  // Note: this is implemented as lazy as possible (ALAP) and will be extended as demands arise.
  //
  // If you need such an element supported:
  //  - add a stub to this class (empty body),
  //  - add code to call the method to the appropriate function,
  //  - and implement the handler here if it can be done in general way
  //    or in your specialized importer.

  this.article = function(state, article) {
    var doc = state.doc;

    // Assign id
    var articleId = article.querySelector("article-id");
    // Note: Substance.Article does only support one id
    if (articleId) {
      doc.id = articleId.textContent;
    } else {
      // if no id was set we create a random one
      doc.id = util.uuid();
    }

    // Extract authors etc.
    this.extractContributors(state, article);

    // Same for the citations, also globally
    this.extractCitations(state, article);

    // First extract all figure-ish content, using a global approach
    this.extractFigures(state, article);

    // Make up a cover node
    this.extractCover(state, article);

    // Extract ArticleMeta
    this.extractArticleMeta(state, article);

    var body = article.querySelector("body");
    if (body) {
      this.body(state, body);
    }

    // Give the config the chance to add stuff
    state.config.enhanceArticle(this, state, article);

  };


  // #### Front.ArticleMeta
  //

  this.extractArticleMeta = function(state, article) {
    // var doc = state.doc;

    var articleMeta = article.querySelector("article-meta");
    if (!articleMeta) {
      throw new ImporterError("Expected element: 'article-meta'");
    }

    // <article-id> Article Identifier, zero or more
    var articleIds = articleMeta.querySelectorAll("article-id");
    this.articleIds(state, articleIds);

    // <title-group> Title Group, zero or one
    var titleGroup = articleMeta.querySelector("title-group");
    if (titleGroup) {
      this.titleGroup(state, titleGroup);
    }

    // <pub-date> Publication Date, zero or more
    var pubDates = articleMeta.querySelectorAll("pub-date");
    this.pubDates(state, pubDates);

    // <abstract> Abstract, zero or more
    var abstracts = articleMeta.querySelectorAll("abstract");

    _.each(abstracts, function(abs) {
      this.abstract(state, abs);
    }, this);

    // Populate Publication Info node
    // ------------

    state.config.extractPublicationInfo(this, state, article);

    // Not supported yet:
    // <trans-abstract> Translated Abstract, zero or more
    // <kwd-group> Keyword Group, zero or more
    // <conference> Conference Information, zero or more
    // <counts> Counts, zero or one
    // <custom-meta-group> Custom Metadata Group, zero or one
  };



  // articleIds: array of <article-id> elements
  this.articleIds = function(state, articleIds) {
    var doc = state.doc;

    // Note: Substance.Article does only support one id
    if (articleIds.length > 0) {
      doc.id = articleIds[0].textContent;
    } else {
      // if no id was set we create a random one
      doc.id = util.uuid();
    }
  };

  this.titleGroup = function(state, titleGroup) {
    var doc = state.doc;

    var articleTitle = titleGroup.querySelector("article-title");
    if (articleTitle) {
      doc.title = articleTitle.textContent;
    }

    // Not yet supported:
    // <subtitle> Document Subtitle, zero or one
  };

  // Note: Substance.Article supports no publications directly.
  // We use the first pub-date for created_at
  this.pubDates = function(state, pubDates) {
    var doc = state.doc;
    if (pubDates.length > 0) {
      var converted = this.pubDate(state, pubDates[0]);
      doc.created_at = converted.date;
    }
  };

  // Note: this does not follow the spec but only takes the parts as it was necessary until now
  // TODO: implement it thoroughly
  this.pubDate = function(state, pubDate) {
    var day = -1;
    var month = -1;
    var year = -1;
    _.each(util.dom.getChildren(pubDate), function(el) {
      var type = util.dom.getNodeType(el);

      var value = el.textContent;
      if (type === "day") {
        day = parseInt(value, 10);
      } else if (type === "month") {
        month = parseInt(value, 10);
      } else if (type === "year") {
        year = parseInt(value, 10);
      }
    }, this);
    var date = new Date(year, month, day);
    return {
      date: date
    };
  };

  this.abstract = function(state, abs) {
    var doc = state.doc;
    var nodes = [];

    var title = abs.querySelector("title");

    var heading = {
      id: state.nextId("heading"),
      type: "heading",
      level: 1,
      content: title ? title.textContent : "Abstract"
    };

    doc.create(heading);
    nodes.push(heading);

    nodes = nodes.concat(this.bodyNodes(state, util.dom.getChildren(abs)));
    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  // ### Article.Body
  //

  this.body = function(state, body) {
    var doc = state.doc;

    var heading = {
      id: state.nextId("heading"),
      type: "heading",
      level: 1,
      content: "Main Text"
    };
    doc.create(heading);

    var nodes = [heading].concat(this.bodyNodes(state, util.dom.getChildren(body)));

    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  // Top-level elements as they can be found in the body or
  // in a section
  // NEW: Also used for boxed-text elements
  this.bodyNodes = function(state, children, startIndex) {
    var nodes = [];
    var node;
    startIndex = startIndex || 0;

    for (var i = startIndex; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (type === "p") {
        nodes = nodes.concat(this.paragraphGroup(state, child));
      }
      else if (type === "sec") {
        nodes = nodes.concat(this.section(state, child));
      }
      else if (type === "list") {
        node = this.list(state, child);
        if (node) nodes.push(node);
      }
      else if (type === "disp-formula") {
        node = this.formula(state, child);
        if (node) nodes.push(node);
      }
      else if (type === "caption") {
        node = this.caption(state, child);
        if (node) nodes.push(node);
      }
      else if (type === "boxed-text") {
        // Just treat as another container
        node = this.boxedText(state, child);
        if (node) nodes.push(node);
        // nodes = nodes.concat(this.bodyNodes(state, util.dom.getChildren(child)));
      }
      else if (type === "disp-quote") {
        // Just treat as another container
        node = this.boxedText(state, child);
        if (node) nodes.push(node);
      }
      // Note: here are some node types ignored which are
      // processed in an extra pass (figures, tables, etc.)
      else if (type === "comment") {
        // Note: Maybe we could create a Substance.Comment?
        // Keep it silent for now
        // console.error("Ignoring comment");
      } else {
        // console.error("Node not yet supported as top-level node: " + type);
      }
    }
    return nodes;
  };


  this.boxedText = function(state, box) {
    var doc = state.doc;

    // Assuming that there are no nested <boxed-text> elements
    var childNodes = this.bodyNodes(state, util.dom.getChildren(box));

    var label = box.querySelector("label");
    var boxId = state.nextId("box");

    var boxNode = {
      "type": "box",
      "id": boxId,
      "source_id": box.getAttribute("id"),
      "label": label ? label.textContent : boxId.replace("_", " "),
      "children": _.pluck(childNodes, 'id')
    };
    doc.create(boxNode);

    // Boxes go into the figures view if these conditions are met
    // 1. box has a label (e.g. elife 00288)
    if (label) {
      doc.show("figures", boxId, -1);
      return null;
    }
    return boxNode;

  };

  this.datasets = function(state, datasets) {
    var nodes = [];

    for (var i=0;i<datasets.length;i++) {
      var data = datasets[i];
      var type = util.dom.getNodeType(data);
      if (type === 'p') {
        var obj = data.querySelector('related-object');
        if (obj) {
          nodes = nodes.concat(this.indivdata(state,obj));
        }
        else {
          var par = this.paragraphGroup(state, data);
          nodes.push(par[0].id);
        }
      }
    }
    return nodes;
  };

  this.indivdata = function(state,indivdata) {
    var doc = state.doc;

    var p1 = {
      "type" : "paragraph",
      "id" : state.nextId("paragraph"),
      "children" : []
    };
    var text1 = {
      "type" : "text",
      "id" : state.nextId("text"),
      "content" : ""
    };
    p1.children.push(text1.id);
    var input = util.dom.getChildren(indivdata);
    for (var i = 0;i<input.length;i++) {
      var info = input[i];
      var type = util.dom.getNodeType(info);
      var par;
      if (type === "name") {
        var children = util.dom.getChildren(info);
        for (var j = 0;j<children.length;j++) {
          var name = children[j];
          if (j === 0) {
            par = this.paragraphGroup(state,name);
            p1.children.push(par[0].children[0]);
          }
          else {
            var text2 = {
              "type" : "text",
              "id" : state.nextId("text"),
              "content" : ", "
            };
            doc.create(text2);
            p1.children.push(text2.id);
            par = this.paragraphGroup(state,name);
            p1.children.push(par[0].children[0]);
          }
        }
      }
      else {
        par = this.paragraphGroup(state,info);
        // Smarter null reference check?
        if (par && par[0] && par[0].children) {
          p1.children.push(par[0].children[0]);
        }
      }
    }
    doc.create(p1);
    doc.create(text1);
    return p1.id;
  };

  this.section = function(state, section) {

    // pushing the section level to track the level for nested sections
    state.sectionLevel++;

    var doc = state.doc;
    var children = util.dom.getChildren(section);

    // create a heading
    // TODO: headings can contain annotations too
    var title = children[0];

    // HACK: parsing the title text in the same way as annotated text
    // however, the document model does not allow this currently
    state.ignoreAnnotations = true;
    var titleIterator = new util.dom.ChildNodeIterator(title);
    var titleText = this.annotatedText(state, titleIterator);
    state.ignoreAnnotations = false;

    var heading = {
      id: state.nextId("heading"),
      source_id: section.getAttribute("id"),
      type: "heading",
      level: state.sectionLevel,
      // TODO: it can happen that there are annotations in the title
      content: titleText
    };
    doc.create(heading);

    // Recursive Descent: get all section body nodes
    var nodes = this.bodyNodes(state, children, 1);
    // add the heading at the front
    nodes.unshift(heading);

    // popping the section level
    state.sectionLevel--;

    return nodes;
  };


  this.ignoredParagraphElements = {
    "comment": true,
    "supplementary-material": true,
    "fig": true,
    "fig-group": true,
    "table-wrap": true,
    "media": true
  };

  this.acceptedParagraphElements = {
    "boxed-text": {handler: "boxedText"},
    "list": { handler: "list" },
    "disp-formula": { handler: "formula" },
  };

  this.inlineParagraphElements = {
    "inline-graphic": true,
    "inline-formula": true
  };

  // Segments children elements of a NLM <p> element
  // into blocks grouping according to following rules:
  // - "text", "inline-graphic", "inline-formula", and annotations
  // - ignore comments, supplementary-materials
  // - others are treated as singles
  this.segmentParagraphElements = function(paragraph) {
    var blocks = [];
    var lastType = "";
    var iterator = new util.dom.ChildNodeIterator(paragraph);

    // first fragment the childNodes into blocks
    while (iterator.hasNext()) {
      var child = iterator.next();
      var type = util.dom.getNodeType(child);

      // ignore some elements
      if (this.ignoredParagraphElements[type]) continue;

      // paragraph elements
      if (type === "text" || this.isAnnotation(type) || this.inlineParagraphElements[type]) {
        if (lastType !== "paragraph") {
          blocks.push({ handler: "paragraph", nodes: [] });
          lastType = "paragraph";
        }
        _.last(blocks).nodes.push(child);
        continue;
      }
      // other elements are treated as single blocks
      else if (this.acceptedParagraphElements[type]) {
        blocks.push(_.extend({node: child}, this.acceptedParagraphElements[type]));
      }
      lastType = type;
    }
    return blocks;
  };


  // A 'paragraph' is given a '<p>' tag
  // An NLM <p> can contain nested elements that are represented flattened in a Substance.Article
  // Hence, this function returns an array of nodes
  this.paragraphGroup = function(state, paragraph) {
    var nodes = [];

    // Note: there are some elements in the NLM paragraph allowed
    // which are flattened here. To simplify further processing we
    // segment the children of the paragraph elements in blocks
    var blocks = this.segmentParagraphElements(paragraph);

    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var node;
      if (block.handler === "paragraph") {
        node = this.paragraph(state, block.nodes);
        if (node) node.source_id = paragraph.getAttribute("id");
      } else {
        node = this[block.handler](state, block.node);
      }
      if (node) nodes.push(node);
    }

    return nodes;
  };

  this.paragraph = function(state, children) {
    var doc = state.doc;

    var node = {
      id: state.nextId("paragraph"),
      type: "paragraph",
      children: null
    };
    var nodes = [];


    var iterator = new util.dom.ChildNodeIterator(children);
    while (iterator.hasNext()) {
      var child = iterator.next();
      var type = util.dom.getNodeType(child);

      // annotated text node
      if (type === "text" || this.isAnnotation(type)) {
        var textNode = {
          id: state.nextId("text"),
          type: "text",
          content: null
        };
        // pushing information to the stack so that annotations can be created appropriately
        state.stack.push({
          node: textNode,
          path: [textNode.id, "content"]
        });
        // Note: this will consume as many textish elements (text and annotations)
        // but will return when hitting the first un-textish element.
        // In that case, the iterator will still have more elements
        // and the loop is continued
        // Before descending, we reset the iterator to provide the current element again.
        var annotatedText = this.annotatedText(state, iterator.back(), 0);

        // Ignore empty paragraphs
        if (annotatedText.length > 0) {
          textNode.content = annotatedText;
          doc.create(textNode);
          nodes.push(textNode);
        }

        // popping the stack
        state.stack.pop();
      }

      // inline image node
      else if (type === "inline-graphic") {
        var url = child.getAttribute("xlink:href");
        var img = {
          id: state.nextId("image"),
          type: "image",
          url: state.config.resolveURL(state, url)
        };
        doc.create(img);
        nodes.push(img);
      }
      else if (type === "inline-formula") {
        var formula = this.formula(state, child, "inline");
        if (formula) {
          nodes.push(formula);
        }
      }
    }

    // if there is only a single node, return do not create a paragraph around it
    // if (nodes.length < 2) {
    //   return nodes[0];
    // } else {
    if (nodes.length === 0) return null;

    node.children = _.map(nodes, function(n) { return n.id; } );
    doc.create(node);
    return node;
    // }
  };

  // List type
  // --------

  this.list = function(state, list) {
    var doc = state.doc;

    var listNode = {
      "id": state.nextId("list"),
      "source_id": list.getAttribute("id"),
      "type": "list",
      "items": [],
      "ordered": false
    };

    // TODO: better detect ordererd list types (need examples)
    if (list.getAttribute("list-type") === "ordered") {
      listNode.ordered = true;
    }

    var listItems = list.querySelectorAll("list-item");
    for (var i = 0; i < listItems.length; i++) {
      var listItem = listItems[i];
      // Note: we do not care much about what is served as items
      // However, we do not have complex nodes on paragraph level
      // They will be extract as sibling items
      var nodes = this.bodyNodes(state, util.dom.getChildren(listItem), 0);
      for (var j = 0; j < nodes.length; j++) {
        listNode.items.push(nodes[j].id);
      }
    }

    doc.create(listNode);
    return listNode;
  };

  // Formula Node Type
  // --------

  var _getFormula = function(formulaElement, inline) {
    var children = util.dom.getChildren(formulaElement);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (type === "mml:math") {
        // make sure that 'display' is set to 'block', otherwise
        // there will be rendering issues.
        // Although it is a rendering related issue it is easier
        // to make this conform here
        if (!inline) {
          child.setAttribute("display", "block");
        }
        return {
          format: "mathml",
          data: _toHtml(child)
        };
      }
      else if (type === "tex-math") {
        return {
          format: "latex",
          data: child.textContent
        };
      }
    }
    return null;
  };

  this.formula = function(state, dispFormula, inline) {
    var doc = state.doc;

    var id = inline ? state.nextId("inline_formula") : state.nextId("formula");

    var formulaNode = {
      id: id,
      source_id: dispFormula.getAttribute("id"),
      type: "formula",
      label: "",
      data: "",
      format: "",
    };
    if (inline) formulaNode.inline = true;

    var label = dispFormula.querySelector("label");
    if (label) formulaNode.label = label.textContent;

    var formula = _getFormula(dispFormula, inline);
    if (!formula) {
      return null;
    } else {
      formulaNode.format = formula.format;
      formulaNode.data = formula.data;
    }
    doc.create(formulaNode);
    return formulaNode;
  };

  // Citations
  // ---------

  this.refList = function(state, refList) {
    var refs = refList.querySelectorAll("ref");
    for (var i = 0; i < refs.length; i++) {
      this.ref(state, refs[i]);
    }
  };

  this.ref = function(state, ref) {
    var children = util.dom.getChildren(ref);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (type === "mixed-citation" || type === "element-citation") {
        this.citation(state, ref, child);
      } else if (type === "label") {
        // ignoring it here...
      } else {
        console.error("Not supported in 'ref': ", type);
      }
    }
  };


  // Citation
  // ------------------
  // NLM input example
  //
  // <element-citation publication-type="journal" publication-format="print">
  // <name><surname>Llanos De La Torre Quiralte</surname>
  // <given-names>M</given-names></name>
  // <name><surname>Garijo Ayestaran</surname>
  // <given-names>M</given-names></name>
  // <name><surname>Poch Olive</surname>
  // <given-names>ML</given-names></name>
  // <article-title xml:lang="es">Evolucion de la mortalidad
  // infantil de La Rioja (1980-1998)</article-title>
  // <trans-title xml:lang="en">Evolution of the infant
  // mortality rate in la Rioja in Spain
  // (1980-1998)</trans-title>
  // <source>An Esp Pediatr</source>
  // <year>2001</year>
  // <month>Nov</month>
  // <volume>55</volume>
  // <issue>5</issue>
  // <fpage>413</fpage>
  // <lpage>420</lpage>
  // <comment>Figura 3, Tendencia de mortalidad infantil
  // [Figure 3, Trends in infant mortality]; p. 418.
  // Spanish</comment>
  // </element-citation>

  // TODO: is implemented naively, should be implemented considering the NLM spec
  this.citation = function(state, ref, citation) {
    var doc = state.doc;
    var citationNode;
    var i;

    var id = state.nextId("article_citation");

    // TODO: we should consider to have a more structured citation type
    // and let the view decide how to render it instead of blobbing everything here.
    var personGroup = citation.querySelector("person-group");

    // HACK: we try to create a 'articleCitation' when there is structured
    // content (ATM, when personGroup is present)
    // Otherwise we create a mixed-citation taking the plain text content of the element
    if (personGroup) {

      citationNode = {
        "id": id,
        "source_id": ref.getAttribute("id"),
        "type": "citation",
        "title": "N/A",
        "label": "",
        "authors": [],
        "doi": "",
        "source": "",
        "volume": "",
        "fpage": "",
        "lpage": "",
        "citation_urls": []
      };

      var nameElements = personGroup.querySelectorAll("name");
      for (i = 0; i < nameElements.length; i++) {
        citationNode.authors.push(_getName(nameElements[i]));
      }

      // Consider collab elements (treat them as authors)
      var collabElements = personGroup.querySelectorAll("collab");
      for (i = 0; i < collabElements.length; i++) {
        citationNode.authors.push(collabElements[i].textContent);
      }

      var source = citation.querySelector("source");
      if (source) citationNode.source = source.textContent;

      var articleTitle = citation.querySelector("article-title");
      if (articleTitle) {
        citationNode.title = articleTitle.textContent;
      } else {
        var comment = citation.querySelector("comment");
        if (comment) {
          citationNode.title = comment.textContent;
        } else {
          // 3rd fallback -> use source
          if (source) {
            citationNode.title = source.textContent;
          } else {
            console.error("FIXME: this citation has no title", citation);  
          }
        }
      }



      var volume = citation.querySelector("volume");
      if (volume) citationNode.volume = volume.textContent;

      var publisherLoc = citation.querySelector("publisher-loc");
      if (publisherLoc) citationNode.publisher_location = publisherLoc.textContent;

      var publisherName = citation.querySelector("publisher-name");
      if (publisherName) citationNode.publisher_name = publisherName.textContent;

      var fpage = citation.querySelector("fpage");
      if (fpage) citationNode.fpage = fpage.textContent;

      var lpage = citation.querySelector("lpage");
      if (lpage) citationNode.lpage = lpage.textContent;

      var year = citation.querySelector("year");
      if (year) citationNode.year = year.textContent;

      // Note: the label is child of 'ref'
      var label = ref.querySelector("label");
      if(label) citationNode.label = label.textContent;

      var doi = citation.querySelector("pub-id[pub-id-type='doi'], ext-link[ext-link-type='doi']");
      if(doi) citationNode.doi = "http://dx.doi.org/" + doi.textContent;
    } else {
      console.error("FIXME: there is one of those 'mixed-citation' without any structure. Skipping ...", citation);
      return;
      // citationNode = {
      //   id: id,
      //   type: "mixed_citation",
      //   citation: citation.textContent,
      //   doi: ""
      // };
    }

    doc.create(citationNode);
    doc.show("citations", id);
  };

  // Article.Back
  // --------
  // Contains things like references, notes, etc.

  // this.back = function(state, back) {
  //   // No processing at the moment
  //   // citations are taken care of in a global handler.
  // };
};


LensImporter.State = function(xmlDoc, doc, options) {
  // the input xml document
  this.xmlDoc = xmlDoc;

  // the output substance document
  this.doc = doc;

  // keep track of the options
  this.options = options || {};

  // store annotations to be created here
  // they will be added to the document when everything else is in place
  this.annotations = [];

  // when recursing into sub-nodes it is necessary to keep the stack
  // of processed nodes to be able to associate other things (e.g., annotations) correctly.
  this.stack = [];

  this.sectionLevel = 1;

  // an id generator for different types
  var ids = {};
  this.nextId = function(type) {
    ids[type] = ids[type] || 0;
    ids[type]++;
    return type +"_"+ids[type];
  };

  // Note: it happens that some XML files are edited without considering the meaning of whitespaces
  // to increase readability.
  // This *hack* eliminates multiple whitespaces at the begin and end of textish elements.
  // Tabs and New Lines are eliminated completely. So with this, the preferred way to prettify your XML
  // is to use Tabuators and New Lines. At the same time, it is not possible anymore to have soft breaks within
  // a text.

  var WS_LEFT = /^\s+/g;
  var WS_LEFT_ALL = /^\s*/g;
  var WS_RIGHT = /\s+$/g;
  // var ALL_WS_NOTSPACE_LEFT = /^[\t\n]+/g;
  // var ALL_WS_NOTSPACE_RIGHT = /[\t\n]+$/g;
  var SPACE = " ";
  var TABS_OR_NL = /[\t\n\r]+/g;

  this.lastChar = "";
  this.acceptText = function(text) {
    if (!this.options.TRIM_WHITESPACES) {
      return text;
    }

    // EXPERIMENTAL: drop all 'formatting' white-spaces (e.g., tabs and new lines)
    // (instead of doing so only at the left and right end)
    //text = text.replace(ALL_WS_NOTSPACE_LEFT, "");
    //text = text.replace(ALL_WS_NOTSPACE_RIGHT, "");
    text = text.replace(TABS_OR_NL, "");

    if (this.lastChar === SPACE) {
      text = text.replace(WS_LEFT_ALL, "");
    } else {
      text = text.replace(WS_LEFT, SPACE);
    }

    text = text.replace(WS_RIGHT, SPACE);

    this.lastChar = text[text.length-1] || this.lastChar;
    return text;
  };

};

// LensImporter.Prototype.prototype = NLMImporter.prototype;
LensImporter.prototype = new LensImporter.Prototype();

module.exports = {
  Importer: LensImporter
};

},{"./configurations/default":49,"./configurations/elife":50,"./configurations/landes":51,"./configurations/peerj":52,"./configurations/plos":53,"lens-article":3,"substance-util":134,"underscore":139}],55:[function(require,module,exports){
"use strict";

var Outline = require('./outline');

module.exports = Outline;

},{"./outline":56}],56:[function(require,module,exports){
"use strict";

var View = require("substance-application").View;
var $$ = require("substance-application").$$;
var _ = require("underscore");

// Lens.Outline
// ==========================================================================
// 
// Takes a surface, which is projected to a minimap

var Outline = function(surface) {
  View.call(this);

  this.surface = surface;

  // Initial view state, telling which node is selected and which are highlighted
  this.state = {
    selectedNode: null,
    highlightedNodes: []
  };

  this.$el.addClass('lens-outline');

  _.bindAll(this, 'mouseDown', 'mouseUp', 'mouseMove', 'updateVisibleArea');

  // Mouse event handlers
  // --------

  this.$el.mousedown(this.mouseDown);
  
  $(window).mousemove(this.mouseMove);
  $(window).mouseup(this.mouseUp);
};

Outline.Prototype = function() {
  
  // Render Document Outline
  // -------------
  // 
  // Renders outline and calculates bounds

  this.render = function() {
    var that = this;
    var totalHeight = 0;

    var fragment = document.createDocumentFragment();
    this.visibleArea = $$('.visible-area');
    fragment.appendChild(this.visibleArea);
    

    // Initial Calculations
    // --------

    var contentHeight = this.surface.$('.nodes').height();
    var panelHeight = this.surface.$el.height();

    var factor = (contentHeight / panelHeight);
    this.factor = factor;

    // Render nodes
    // --------

    var container = this.surface.doc.container;
    var nodes = container.getTopLevelNodes();

    _.each(nodes, function(node) {
      var dn = this.surface.$('#'+node.id);
      var height = dn.outerHeight(true) / factor;

      // Outline node construction
      var $node = $('<div class="node">')
        .attr({
          id: 'outline_'+node.id,
        })
        .css({
          "position": "absolute",
          "height": height-1,
          "top": totalHeight
        })
        .addClass(node.type)
        .append('<div class="arrow">');
      fragment.appendChild($node[0]);
      totalHeight += height;
    }, this);

    // Init scroll pos
    var scrollTop = that.surface.$el.scrollTop();


    that.el.innerHTML = "";
    that.el.appendChild(fragment);
    that.updateVisibleArea(scrollTop);

    return this;
  };


  // Update visible area
  // -------------
  // 
  // Should get called from the user when the content area is scrolled

  this.updateVisibleArea = function(scrollTop) {
    $(this.visibleArea).css({
      "top": scrollTop / this.factor,
      "height": this.surface.$el.height() / this.factor
    });
  };


  // Update Outline
  // -------------
  // 
  // Usage:
  // 
  // outline.update({
  //   selectedNode: "node_14",
  //   highlightNodes: []
  // })

  this.update = function(state) {
    this.render();
    this.state = state;

    // Reset
    this.$('.node').removeClass('selected').removeClass('highlighted');
    this.$el.removeClass('figures').removeClass('citations');

    // Set context
    this.$el.addClass(state.context);

    // Mark selected node
    this.$('#outline_' + state.selectedNode).addClass('selected');

    // 2. Mark highlighted nodes
    _.each(state.highlightedNodes, function(n) {
      this.$('#outline_'+n).addClass('highlighted');
    }, this);
  };


  // Handle Mouse down event
  // -----------------
  // 

  this.mouseDown = function(e) {
    this._mouseDown = true;
    var y = e.pageY;

    if (e.target !== this.visibleArea) {
      // Jump to mousedown position
      this.offset = $(this.visibleArea).height()/2;
      this.mouseMove(e);
    } else {
      this.offset = y - $(this.visibleArea).position().top;  
    }

    return false;
  };

  // Handle Mouse Up
  // -----------------
  // 
  // Mouse lifted, no scroll anymore

  this.mouseUp = function() {
    this._mouseDown = false;
  };

  // Handle Scroll
  // -----------------
  // 
  // Handle scroll event
  // .visible-area handle

  this.mouseMove = function(e) {
    if (this._mouseDown) {
      var y = e.pageY;
      // find offset to visible-area.top
      var scroll = (y - this.offset)*this.factor;
      this.surface.$el.scrollTop(scroll);
    }
  };
};

Outline.Prototype.prototype = View.prototype;
Outline.prototype = new Outline.Prototype();

module.exports = Outline;

},{"substance-application":57,"underscore":139}],57:[function(require,module,exports){
"use strict";

var Application = require("./src/application");
Application.View = require("./src/view");
Application.Router = require("./src/router");
Application.Controller = require("./src/controller");
Application.ElementRenderer = require("./src/renderers/element_renderer");
Application.$$ = Application.ElementRenderer.$$;

module.exports = Application;

},{"./src/application":58,"./src/controller":59,"./src/renderers/element_renderer":60,"./src/router":61,"./src/view":62}],58:[function(require,module,exports){
"use strict";

var View = require("./view");
var Router = require("./router");
var util = require("substance-util");
var _ = require("underscore");

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(config) {
  View.call(this);
  this.config = config;
};

Application.Prototype = function() {
  
  // Init router
  // ----------

  this.initRouter = function() {
    this.router = new Router();

    _.each(this.config.routes, function(route) {
      this.router.route(route.route, route.name, _.bind(this.controller[route.command], this.controller));
    }, this);

    Router.history.start();
  };

  // Start Application
  // ----------
  //

  this.start = function() {
    // First setup the top level view
    this.$el = $('body');
    this.el = this.$el[0];
    this.render();

    // Now the normal app lifecycle can begin
    // Because app state changes require the main view to be present
    // Triggers an initial app state change according to url hash fragment
    this.initRouter();
  };
};

// Setup prototype chain

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

module.exports = Application;

},{"./router":61,"./view":62,"substance-util":134,"underscore":139}],59:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function(options) {
  this.state = {};
  this.context = null;
};

Controller.Prototype = function() {

  // Finalize state transition
  // -----------------
  //
  // Editor View listens on state-changed events:
  //
  // Maybe this should updateContext, so it can't be confused with the app state
  // which might be more than just the current context
  // 

  this.updateState = function(context, state) {
    console.error('updateState is deprecated, use modifyState. State is now a rich object where context replaces the old state variable');
    var oldContext = this.context;
    this.context = context;
    this.state = state;
    this.trigger('state-changed', this.context, oldContext, state);
  };

  // Inrementally updates the controller state
  // -----------------
  //

  this.modifyState = function(state) {
    var prevContext = this.state.context;
    _.extend(this.state, state);

    if (state.context && state.context !== prevContext) {
      this.trigger('context-changed', state.context);
    }
    
    this.trigger('state-changed', this.state.context);
  };
};


// Setup prototype chain
Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

module.exports = Controller;
},{"substance-util":134,"underscore":139}],60:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var SRegExp = require("substance-regexp");

// Substance.Application.ElementRenderer
// ==========================================================================
//
// This is just a simple helper that allows us to create DOM elements
// in a data-driven way

var ElementRenderer = function(attributes) {
  this.attributes = attributes;

  // Pull off preserved properties from attributes
  // --------

  this.tagName = attributes.tag;  
  this.children = attributes.children || [];
  this.text = attributes.text || "";
  this.html = attributes.html;
  
  delete attributes.children;
  delete attributes.text;
  delete attributes.html;
  delete attributes.tag;

  return this.render();
};


ElementRenderer.Prototype = function() {

  // Do the actual rendering
  // --------

  this.render = function() {
    var el = document.createElement(this.tagName);
    if (this.html) {
      el.innerHTML = this.html;
    } else {
      el.textContent = this.text;  
    }

    // Set attributes based on element spec
    for(var attrName in this.attributes) {
      var val = this.attributes[attrName];
      el.setAttribute(attrName, val);
    }

    // Append childs
    for (var i=0; i<this.children.length; i++) {
      var child = this.children[i];
      el.appendChild(child);
    }

    // Remember element
    // Probably we should ditch this
    this.el = el;
    return el;
  };
};


// Provides a shortcut syntax interface to ElementRenderer
// --------

var $$ = function(descriptor, options) {
  var options = options  || {};

  // Extract tagName, defaults to 'div'
  var tagName = /^([a-zA-Z0-9]*)/.exec(descriptor);
  options.tag = tagName && tagName[1] ? tagName[1] : 'div';

  // Any occurence of #some_chars
  var id = /#([a-zA-Z0-9_]*)/.exec(descriptor);
  if (id && id[1]) options.id = id[1];

  // Any occurence of .some-chars
  // if (!options.class) {
  //   var re = new RegExp(/\.([a-zA-Z0-9_-]*)/g);
  //   var classes = [];
  //   var classMatch;
  //   while (classMatch = re.exec(descriptor)) {
  //     classes.push(classMatch[1]);
  //   }
  //   options.class = classes.join(' ');
  // }

  // Any occurence of .some-chars
  var matchClasses = new SRegExp(/\.([a-zA-Z0-9_-]*)/g);
  // options.class = options.class ? options.class+' ' : '';
  if (!options.class) {
    options.class = matchClasses.match(descriptor).map(function(m) {
      return m.match[1];
    }).join(' ');
  }
  
  return new ElementRenderer(options);
};



ElementRenderer.$$ = $$;

// Setup prototype chain
ElementRenderer.Prototype.prototype = util.Events;
ElementRenderer.prototype = new ElementRenderer.Prototype();

module.exports = ElementRenderer;
},{"substance-regexp":128,"substance-util":134}],61:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Application.Router
// ---------------
//
// Implementation borrowed from Backbone.js

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
var Router = function(options) {
  options || (options = {});
  if (options.routes) this.routes = options.routes;
  this._bindRoutes();
  this.initialize.apply(this, arguments);
};

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam    = /(\(\?)?:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

// Set up all inheritable **Application.Router** properties and methods.
_.extend(Router.prototype, util.Events, {

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function(){},

  // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //     });
  //
  route: function(route, name, callback) {
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) callback = this[name];
    var router = this;
    Router.history.route(route, function(fragment) {
      var args = router._extractParameters(route, fragment);
      callback && callback.apply(router, args);
      router.trigger.apply(router, ['route:' + name].concat(args));
      router.trigger('route', name, args);
      Router.history.trigger('route', router, name, args);
    });
    return this;
  },

  // Simple proxy to `Router.history` to save a fragment into the history.
  navigate: function(fragment, options) {
    Router.history.navigate(fragment, options);
    return this;
  },

  // Bind all defined routes to `Router.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes: function() {
    if (!this.routes) return;
    this.routes = _.result(this, 'routes');
    var route, routes = _.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  },

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function(route) {
    route = route.replace(escapeRegExp, '\\$&')
                 .replace(optionalParam, '(?:$1)?')
                 .replace(namedParam, function(match, optional){
                   return optional ? match : '([^\/]+)';
                 })
                 .replace(splatParam, '(.*?)');
    return new RegExp('^' + route + '$');
  },

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function(route, fragment) {
    var params = route.exec(fragment).slice(1);
    return _.map(params, function(param) {
      return param ? decodeURIComponent(param) : null;
    });
  }
});




// Router.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
var History = Router.History = function() {
  this.handlers = [];
  _.bindAll(this, 'checkUrl');

  // Ensure that `History` can be used outside of the browser.
  if (typeof window !== 'undefined') {
    this.location = window.location;
    this.history = window.history;
  }
};

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for detecting MSIE.
var isExplorer = /msie [\w.]+/;

// Cached regex for removing a trailing slash.
var trailingSlash = /\/$/;

// Has the history handling already been started?
History.started = false;

// Set up all inheritable **Router.History** properties and methods.
_.extend(History.prototype, util.Events, {

  // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  interval: 50,

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash: function(window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  // Get the cross-browser normalized URL fragment, either from the URL,
  // the hash, or the override.
  getFragment: function(fragment, forcePushState) {
    if (fragment == null) {
      if (this._hasPushState || !this._wantsHashChange || forcePushState) {
        fragment = this.location.pathname;
        var root = this.root.replace(trailingSlash, '');
        if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  },

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start: function(options) {
    if (History.started) throw new Error("Router.history has already been started");
    History.started = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options          = _.extend({}, {root: '/'}, this.options, options);
    this.root             = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._wantsPushState  = !!this.options.pushState;
    this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
    var fragment          = this.getFragment();
    var docMode           = document.documentMode;
    var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

    // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');

    if (oldIE && this._wantsHashChange) {
      this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
      this.navigate(fragment);
    }

    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._hasPushState) {
      $(window).on('popstate', this.checkUrl);
    } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
      $(window).on('hashchange', this.checkUrl);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }

    // Determine if we need to change the base url, for a pushState link
    // opened by a non-pushState browser.
    this.fragment = fragment;
    var loc = this.location;
    var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

    // If we've started off with a route from a `pushState`-enabled browser,
    // but we're currently in a browser that doesn't support it...
    if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
      this.fragment = this.getFragment(null, true);
      this.location.replace(this.root + this.location.search + '#' + this.fragment);
      // Return immediately as browser will do redirect to new url
      return true;

    // Or if we've started out with a hash-based route, but we're currently
    // in a browser where it could be `pushState`-based instead...
    } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
      this.fragment = this.getHash().replace(routeStripper, '');
      this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
    }

    if (!this.options.silent) return this.loadUrl();
  },

  // Disable Router.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop: function() {
    $(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
    clearInterval(this._checkUrlInterval);
    History.started = false;
  },

  // Add a route to be tested when the fragment changes. Routes added later
  // may override previous routes.
  route: function(route, callback) {
    this.handlers.unshift({route: route, callback: callback});
  },

  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl: function(e) {
    var current = this.getFragment();
    if (current === this.fragment && this.iframe) {
      current = this.getFragment(this.getHash(this.iframe));
    }
    if (current === this.fragment) return false;
    if (this.iframe) this.navigate(current);
    this.loadUrl() || this.loadUrl(this.getHash());
  },

  // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl: function(fragmentOverride) {
    var fragment = this.fragment = this.getFragment(fragmentOverride);
    var matched = _.any(this.handlers, function(handler) {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);
        return true;
      }
    });
    return matched;
  },

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate: function(fragment, options) {
    if (!History.started) return false;
    if (!options || options === true) options = {trigger: options};
    fragment = this.getFragment(fragment || '');
    if (this.fragment === fragment) return;
    this.fragment = fragment;
    var url = this.root + fragment;

    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._hasPushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

    // If hash changes haven't been explicitly disabled, update the hash
    // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if(!options.replace) this.iframe.document.open().close();
        this._updateHash(this.iframe.location, fragment, options.replace);
      }

    // If you've told us that you explicitly don't want fallback hashchange-
    // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) this.loadUrl(fragment);
  },

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash: function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  }
});

Router.history = new History;


module.exports = Router;
},{"substance-util":134,"underscore":139}],62:[function(require,module,exports){
"use strict";

var util = require("substance-util");

// Substance.View
// ==========================================================================
//
// Application View abstraction, inspired by Backbone.js

var View = function(options) {
  var that = this;

  // Either use the provided element or make up a new element
  this.$el = $('<div/>');
  this.el = this.$el[0];

  this.dispatchDOMEvents();
};


View.Prototype = function() {


  // Shorthand for selecting elements within the view
  // ----------
  //

  this.$ = function(selector) {
    return this.$el.find(selector);
  };

  // Dispatching DOM events (like clicks)
  // ----------
  //

  this.dispatchDOMEvents = function() {

    var that = this;

    // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
    // showReport(12) => ["showReport(12)", "showReport", "12"]
    function extractFunctionCall(str) {
      var match = /(\w+)\((.*)\)/.exec(str);
      if (!match) throw new Error("Invalid click handler '"+str+"'");

      return {
        "method": match[1],
        "args": match[2].split(',')
      };
    }

    this.$el.delegate('[sbs-click]', 'click', function(e) {
      
      // Matches things like this
      // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
      // showReport(12) => ["showReport(12)", "showReport", "12"]
      var fnCall = extractFunctionCall($(e.currentTarget).attr('sbs-click'));
      
      // Event bubbles up if there is no handler
      var method = that[fnCall.method];
      if (method) { 
        method.apply(that, fnCall.args);
        return false;
      }
    });
  };
};


View.Prototype.prototype = util.Events;
View.prototype = new View.Prototype();

module.exports = View;

},{"substance-util":134}],63:[function(require,module,exports){
"use strict";

var Data = {};

// Current version of the library. Keep in sync with `package.json`.
Data.VERSION = '0.8.0';

Data.Graph = require('./src/simple_graph');

module.exports = Data;

},{"./src/simple_graph":67}],64:[function(require,module,exports){
var _ = require("underscore");
var util = require("substance-util");

// Creates an index for the document applying a given node filter function
// and grouping using a given key function
// --------
//
// - document: a document instance
// - filter: a function that takes a node and returns true if the node should be indexed
// - key: a function that provides a path for scoped indexing (default: returns empty path)
//

var Index = function(graph, options) {
  options = options || {};

  this.graph = graph;

  this.nodes = {};
  this.scopes = {};

  if (options.filter) {
    this.filter = options.filter;
  } else if (options.types) {
    this.filter = Index.typeFilter(graph.schema, options.types);
  }

  if (options.property) {
    this.property = options.property;
  }

  this.createIndex();
};

Index.Prototype = function() {

  // Resolves a sub-hierarchy of the index via a given path
  // --------
  //

  var _resolve = function(path) {
    var index = this;
    if (path !== null) {
      for (var i = 0; i < path.length; i++) {
        var id = path[i];
        index.scopes[id] = index.scopes[id] || { nodes: {}, scopes: {} };
        index = index.scopes[id];
      }
    }
    return index;
  };

  var _getKey = function(node) {
    if (!this.property) return null;
    var key = node[this.property] ? node[this.property] : null;
    if (_.isString(key)) key = [key];
    return key;
  };

  // Accumulates all indexed children of the given (sub-)index
  var _collect = function(index) {
    var result = _.extend({}, index.nodes);
    _.each(index.scopes, function(child, name) {
      if (name !== "nodes") {
        _.extend(result, _collect(child));
      }
    });
    return result;
  };

  var _add = function(key, node) {
    var index = _resolve.call(this, key);
    index.nodes[node.id] = node.id;
  };

  var _remove = function(key, node) {
    var index = _resolve.call(this, key);
    delete index.nodes[node.id];
  };

  // Keeps the index up-to-date when the graph changes.
  // --------
  //

  this.onGraphChange = function(op) {

    var self = this;

    var adapter = {
      create: function(node) {
        if (!self.filter || self.filter(node)) {
          var key = _getKey.call(self, node);
          _add.call(self, key, node);
        }
      },
      delete: function(node) {
        if (!self.filter || self.filter(node)) {
          var key = _getKey.call(self, node);
          _remove.call(self, key, node);
        }
      },
      update: function(node, property, newValue, oldValue) {
        if ((self.property === property) && (!self.filter || self.filter(node))) {
          var key = oldValue;
          if (_.isString(key)) key = [key];
          _remove.call(self, key, node);
          key = newValue;
          if (_.isString(key)) key = [key];
          _add.call(self, key, node);
        }
      }
    };

    this.graph.cotransform(adapter, op);
  };

  // Initializes the index
  // --------
  //

  this.createIndex = function() {
    this.reset();

    var nodes = this.graph.nodes;
    _.each(nodes, function(node) {
      if (!this.filter || this.filter(node)) {
        var key = _getKey.call(this, node);
        _add.call(this, key, node);
      }
    }, this);
  };

  // Collects all indexed nodes using a given path for scoping
  // --------
  //

  this.get = function(path) {
    if (arguments.length === 0) {
      path = null;
    } else if (_.isString(path)) {
      path = [path];
    }

    var index = _resolve.call(this, path);
    var result;

    // EXPERIMENTAL: do we need the ability to retrieve indexed elements non-recursively
    // for now...
    // if so... we would need an paramater to prevent recursion
    // E.g.:
    //     if (shallow) {
    //       result = index.nodes;
    //     }
    result = _collect(index);

    _.each(result, function(id) {
      result[id] = this.graph.get(id);
    }, this);

    return result;
  };

  this.reset = function() {
    this.nodes = {};
    this.scopes = {};
  };

  this.dispose = function() {
    this.stopListening();
  };
};

Index.prototype = _.extend(new Index.Prototype(), util.Events.Listener);

Index.typeFilter = function(schema, types) {
  return function(node) {
    var typeChain = schema.typeChain(node.type);
    for (var i = 0; i < types.length; i++) {
      if (typeChain.indexOf(types[i]) >= 0) {
        return true;
      }
    }
    return false;
  };
};

module.exports = Index;

},{"substance-util":134,"underscore":139}],65:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var Property = function(graph, path) {
  if (!path) {
    throw new Error("Illegal argument: path is null/undefined.");
  }

  this.graph = graph;
  this.schema = graph.schema;

  _.extend(this, this.resolve(path));
};

Property.Prototype = function() {

  this.resolve = function(path) {
    var node = this.graph;
    var parent = node;
    var type = "graph";

    var key;
    var value;

    var idx = 0;
    for (; idx < path.length; idx++) {

      // TODO: check if the property references a node type
      if (type === "graph" || this.schema.types[type] !== undefined) {
        // remember the last node type
        parent = this.graph.get(path[idx]);

        if (parent === undefined) {
          //throw new Error("Key error: could not find element for path " + JSON.stringify(path));
          return undefined;
        }

        node = parent;
        type = this.schema.properties(parent.type);
        value = node;
        key = undefined;
      } else {
        if (parent === undefined) {
          //throw new Error("Key error: could not find element for path " + JSON.stringify(path));
          return undefined;
        }
        key = path[idx];
        var propName = path[idx];
        type = type[propName];
        value = parent[key];

        if (idx < path.length-1) {
          parent = parent[propName];
        }
      }
    }

    return {
      node: node,
      parent: parent,
      type: type,
      key: key,
      value: value
    };

  };

  this.get = function() {
    if (this.key !== undefined) {
      return this.parent[this.key];
    } else {
      return this.node;
    }
  };

  this.set = function(value) {
    if (this.key !== undefined) {
      this.parent[this.key] = this.schema.parseValue(this.baseType, value);
    } else {
      throw new Error("'set' is only supported for node properties.");
    }
  };

};
Property.prototype = new Property.Prototype();
Object.defineProperties(Property.prototype, {
  baseType: {
    get: function() {
      if (_.isArray(this.type)) return this.type[0];
      else return this.type;
    }
  },
  path: {
    get: function() {
      return [this.node.id, this.key];
    }
  }
});

module.exports = Property;

},{"underscore":139}],66:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");


// Data.Schema
// ========
//
// Provides a schema inspection API

var Schema = function(schema) {
  _.extend(this, schema);
};

Schema.Prototype = function() {

  // Return Default value for a given type
  // --------
  //

  this.defaultValue = function(valueType) {
    if (valueType === "object") return {};
    if (valueType === "array") return [];
    if (valueType === "string") return "";
    if (valueType === "number") return 0;
    if (valueType === "boolean") return false;
    if (valueType === "date") return new Date();

    return null;
    // throw new Error("Unknown value type: " + valueType);
  };

  // Return type object for a given type id
  // --------
  //

  this.parseValue = function(valueType, value) {
    if (value === null) {
      return value;
    }

    if (_.isString(value)) {
      if (valueType === "object") return JSON.parse(value);
      if (valueType === "array") return JSON.parse(value);
      if (valueType === "string") return value;
      if (valueType === "number") return parseInt(value, 10);
      if (valueType === "boolean") {
        if (value === "true") return true;
        else if (value === "false") return false;
        else throw new Error("Can not parse boolean value from: " + value);
      }
      if (valueType === "date") return new Date(value);

      // all other types must be string compatible ??
      return value;

    } else {
      if (valueType === 'array') {
        if (!_.isArray(value)) {
          throw new Error("Illegal value type: expected array.");
        }
        value = util.deepclone(value);
      }
      else if (valueType === 'string') {
        if (!_.isString(value)) {
          throw new Error("Illegal value type: expected string.");
        }
      }
      else if (valueType === 'object') {
        if (!_.isObject(value)) {
          throw new Error("Illegal value type: expected object.");
        }
        value = util.deepclone(value);
      }
      else if (valueType === 'number') {
        if (!_.isNumber(value)) {
          throw new Error("Illegal value type: expected number.");
        }
      }
      else if (valueType === 'boolean') {
        if (!_.isBoolean(value)) {
          throw new Error("Illegal value type: expected boolean.");
        }
      }
      else if (valueType === 'date') {
        value = new Date(value);
      }
      else {
        throw new Error("Unsupported value type: " + valueType);
      }
      return value;
    }
  };

  // Return type object for a given type id
  // --------
  //

  this.type = function(typeId) {
    return this.types[typeId];
  };

  // For a given type id return the type hierarchy
  // --------
  //
  // => ["base_type", "specific_type"]

  this.typeChain = function(typeId) {
    var type = this.types[typeId];
    if (!type) {
      throw new Error('Type ' + typeId + ' not found in schema');
    }

    var chain = (type.parent) ? this.typeChain(type.parent) : [];
    chain.push(typeId);
    return chain;
  };

  this.isInstanceOf = function(type, parentType) {
    var typeChain = this.typeChain(type);
    if (typeChain && typeChain.indexOf(parentType) >= 0) {
      return true;
    } else {
      return false;
    }
  };

  // Provides the top-most parent type of a given type.
  // --------
  //

  this.baseType = function(typeId) {
    return this.typeChain(typeId)[0];
  };

  // Return all properties for a given type
  // --------
  //

  this.properties = function(type) {
    type = _.isObject(type) ? type : this.type(type);
    var result = (type.parent) ? this.properties(type.parent) : {};
    _.extend(result, type.properties);
    return result;
  };

  // Returns the full type for a given property
  // --------
  //
  // => ["array", "string"]

  this.propertyType = function(type, property) {
    var properties = this.properties(type);
    var propertyType = properties[property];
    if (!propertyType) throw new Error("Property not found for" + type +'.'+property);
    return _.isArray(propertyType) ? propertyType : [propertyType];
  };

  // Returns the base type for a given property
  // --------
  //
  //  ["string"] => "string"
  //  ["array", "string"] => "array"

  this.propertyBaseType = function(type, property) {
    return this.propertyType(type, property)[0];
  };
};

Schema.prototype = new Schema.Prototype();

module.exports = Schema;

},{"substance-util":134,"underscore":139}],67:[function(require,module,exports){
"use strict";

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;

var Schema = require('./schema');
var Property = require('./property');
var Index = require('./graph_index');

var GraphError = errors.define("GraphError");

// Data types registry
// -------------------
// Available data types for graph properties.

var VALUE_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'boolean',
  'date'
];


// Check if composite type is in types registry.
// The actual type of a composite type is the first entry
// I.e., ["array", "string"] is an array in first place.
var isValueType = function (type) {
  if (_.isArray(type)) {
    type = type[0];
  }
  return VALUE_TYPES.indexOf(type) >= 0;
};

// Graph
// =====

// A `Graph` can be used for representing arbitrary complex object
// graphs. Relations between objects are expressed through links that
// point to referred objects. Graphs can be traversed in various ways.
// See the testsuite for usage.
//
// Need to be documented:
// @options (mode,seed,chronicle,store,load,graph)
var Graph = function(schema, options) {
  options = options || {};

  // Initialization
  this.schema = new Schema(schema);

  // Check if provided seed conforms to the given schema
  // Only when schema has an id and seed is provided

  if (this.schema.id && options.seed && options.seed.schema) {
    if (!_.isEqual(options.seed.schema, [this.schema.id, this.schema.version])) {
      throw new GraphError([
        "Graph does not conform to schema. Expected: ",
        this.schema.id+"@"+this.schema.version,
        " Actual: ",
        options.seed.schema[0]+"@"+options.seed.schema[1]
      ].join(''));
    }
  }

  this.nodes = {};
  this.indexes = {};

  this.__seed__ = options.seed;

  this.init();
};

Graph.Prototype = function() {

  // Graph manipulation API
  // ======================

  // Add a new node
  // --------------
  // Adds a new node to the graph
  // Only properties that are specified in the schema are taken:
  //     var node = {
  //       id: "apple",
  //       type: "fruit",
  //       name: "My Apple",
  //       color: "red",
  //       val: { size: "big" }
  //     };
  // Create new node:
  //     Data.Graph.create(node);
  // Note: graph create operation should reject creation of duplicate nodes.

  _.extend(this, util.Events);

  this.create = function(node) {
    this.nodes[node.id] = node;
  };

  // Remove a node
  // -------------
  // Removes a node with given id and key (optional):
  //     Data.Graph.delete(this.graph.get('apple'));
  this.delete = function(id) {
    delete this.nodes[id];
  };

  // Set the property
  // ----------------
  //
  // Sets the property to a given value:
  // Data.Graph.set(["fruit_2", "val", "size"], "too small");
  // Let's see what happened with node:
  //     var blueberry = this.graph.get("fruit_2");
  //     console.log(blueberry.val.size);
  //     = > 'too small'

  this.set = function(path, newValue) {
    var prop = this.resolve(path);
    if (!prop) {
      throw new GraphError("Could not resolve property with path "+JSON.stringify(path));
    }
    prop.set(newValue);
  };

  // Get the node [property]
  // -----------------------
  //
  // Gets specified graph node using id:
  //  var apple = this.graph.get("apple");
  //  console.log(apple);
  //  =>
  //  {
  //    id: "apple",
  //    type: "fruit",
  //    name: "My Apple",
  //    color: "red",
  //    val: { size: "big" }
  //  }
  // or get node's property:
  //  var apple = this.graph.get(["apple","color"]);
  //  console.log(apple);
  //  => 'red'

  this.get = function(path) {
    if (!_.isArray(path) && !_.isString(path)) {
      throw new GraphError("Invalid argument path. Must be String or Array");
    }

    if (arguments.length > 1) path = _.toArray(arguments);
    if (_.isString(path)) return this.nodes[path];

    var prop = this.resolve(path);
    return prop.get();
  };

  // Query graph data
  // ----------------
  //
  // Perform smart querying on graph
  //     graph.create({
  //       id: "apple-tree",
  //       type: "tree",
  //       name: "Apple tree"
  //     });
  //     var apple = this.graph.get("apple");
  //     apple.set({["apple","tree"], "apple-tree"});
  // let's perform query:
  //     var result = graph.query(["apple", "tree"]);
  //     console.log(result);
  //     => [{id: "apple-tree", type: "tree", name: "Apple tree"}]

  this.query = function(path) {
    var prop = this.resolve(path);

    var type = prop.type;
    var baseType = prop.baseType;
    var val = prop.get();

    // resolve referenced nodes in array types
    if (baseType === "array") {
      return this._queryArray.call(this, val, type);
    } else if (!isValueType(baseType)) {
      return this.get(val);
    } else {
      return val;
    }
  };

  // Serialize current state
  // -----------------------
  //
  // Convert current graph state to JSON object

  this.toJSON = function() {
    return {
      id: this.id,
      schema: [this.schema.id, this.schema.version],
      nodes: util.deepclone(this.nodes)
    };
  };

  // Check node existing
  // -------------------
  //
  // Checks if a node with given id exists
  //     this.graph.contains("apple");
  //     => true
  //     this.graph.contains("orange");
  //     => false

  this.contains = function(id) {
    return (!!this.nodes[id]);
  };

  // Resolve a property
  // ------------------
  // Resolves a property with a given path

  this.resolve = function(path) {
    return new Property(this, path);
  };

  // Reset to initial state
  // ----------------------
  // Resets the graph to its initial state.
  // Note: This clears all nodes and calls `init()` which may seed the graph.

  this.reset = function() {
    this.init();
    this.trigger("graph:reset");
  };

  // Graph initialization.
  this.init = function() {
    this.__is_initializing__ = true;

    if (this.__seed__) {
      this.nodes = util.clone(this.__seed__.nodes);
    } else {
      this.nodes = {};
    }

    _.each(this.indexes, function(index) {
      index.reset();
    });

    delete this.__is_initializing__;
  };

  this.addIndex = function(name, options) {
    if (this.indexes[name]) {
      throw new GraphError("Index with name " + name + "already exists.");
    }
    var index = new Index(this, options);
    this.indexes[name] = index;

    return index;
  };

  this.removeIndex = function(name) {
    delete this.indexes[name];
  };

  this._queryArray = function(arr, type) {
    if (!_.isArray(type)) {
      throw new GraphError("Illegal argument: array types must be specified as ['array'(, 'array')*, <type>]");
    }
    var result, idx;
    if (type[1] === "array") {
      result = [];
      for (idx = 0; idx < arr.length; idx++) {
        result.push(this._queryArray(arr[idx], type.slice(1)));
      }
    } else if (!isValueType(type[1])) {
      result = [];
      for (idx = 0; idx < arr.length; idx++) {
        result.push(this.get(arr[idx]));
      }
    } else {
      result = arr;
    }
    return result;
  };

};

// Index Modes
// ----------

Graph.STRICT_INDEXING = 1 << 1;
Graph.DEFAULT_MODE = Graph.STRICT_INDEXING;


Graph.prototype = new Graph.Prototype();

Graph.Schema = Schema;
Graph.Property = Property;
Graph.Index = Index;

// Exports
// ========

module.exports = Graph;

},{"./graph_index":64,"./property":65,"./schema":66,"substance-util":134,"underscore":139}],68:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var Document = require('./src/document');
Document.Annotator = require('./src/annotator');
Document.Container = require('./src/container');
Document.Cursor = require('./src/cursor');
Document.Selection = require('./src/selection');
Document.Controller = require('./src/controller');

Document.Node = require('./src/node');
Document.Composite = require('./src/composite');
// TODO: this should also be moved to 'substance-nodes'
// However, currently there is too much useful in it that is also necessary for the test-suite
// Maybe, we should extract such things into helper functions so that it is easier to
// create custom text based, annotatable nodes.
Document.TextNode = require('./src/text_node');

// Compatibility
Document.Writer = require('./src/controller');

module.exports = Document;

},{"./src/annotator":69,"./src/composite":71,"./src/container":72,"./src/controller":73,"./src/cursor":74,"./src/document":75,"./src/node":76,"./src/selection":77,"./src/text_node":78,"underscore":139}],69:[function(require,module,exports){
"use strict";

// Import
// ========

var _ = require("underscore");
var util = require("substance-util");
var Data = require("substance-data");
var Document = require("./document");
var Selection = require("./selection");
var DocumentError = Document.DocumentError;
var Operator = require("substance-operator");

// Module
// ========

// A class that manages a document's annotations.
// --------
//

var Annotator = function(doc, options) {
  options = options || {};

  this.document = doc;

  // register for co-transformations to keep annotations up2date.
  this.document.on("operation:applied", this.handleOperation, this);

  // defines groups of annotations that will be mutually exclusive
  this.group = {
    "emphasis": "style",
    "strong": "style",
    "link": "style",
    "question": "marker",
    "idea": "marker",
    "error": "marker"
  };


  this.expansion = {
    "emphasis": {
      left: Annotator.isOnNodeStart,
    },
    "strong": {
      left: Annotator.isOnNodeStart,
    }
  };

  this.splittable = ["emphasis", "strong"];

  this._index = Annotator.createIndex(doc);

  this.withTransformation = options.withTransformation;
};

Annotator.Prototype = function() {

  var _getRanges = function(self, sel) {
    var nodes = sel.getNodes();
    var ranges = {};

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var range = [0,null];

      // in the first node search only in the trailing part
      if (i === 0) {
        range[0] = sel.startChar();
      }

      // in the last node search only in the leading part
      if (i === nodes.length-1) {
        range[1] = sel.endChar();
      }

      ranges[node.id] = range;
    }

    return ranges;
  };

  // Creates a new annotation
  // --------
  //

  var _create = function(self, path, type, range, data) {
    var annotation = {
      "id": util.uuid(),
      "type": type,
      "path": path,
      "range": range
    };

    if (data) _.extend(annotation, data);
    return self.create(annotation);
  };

  // Deletes an annotation
  // --------
  //
  var _delete = function(self, annotation) {
    self.document.delete(annotation.id);
  };

  var _update = function(self, annotation, newRange) {
    self.document.apply(Operator.ObjectOperation.Set([annotation.id, "range"], annotation.range, newRange));
  };

  // TODO: extract range overlap checking logic into a dedicated Range class
  var _filterByNodeAndRange = function(view, nodeId, range) {
    var annotations = this._index.get(nodeId);

    if (range) {
      var sStart = range[0];
      var sEnd = range[1];

      var filtered = {};

      // Note: this treats all annotations as if they were inclusive (left+right)
      // TODO: maybe we should apply the same rules as for Transformations?
      _.each(annotations, function(a) {
        var aStart = a.range[0];
        var aEnd = a.range[1];

        var overlap = (aEnd >= sStart);

        // Note: it is allowed to give only omit the end part
        if (sEnd) {
          overlap &= aStart <= sEnd;
        }

        if (overlap) {
          filtered[a.id] = a;
        }
      });
      annotations = filtered;
    }

    return annotations;
  };


  // Truncates an existing annotation
  // --------
  // Deletes an annotation that has a collapsed range after truncation.
  // If the annotation is splittable and the given range is an inner segment,
  // the first will be truncated and a second one will be created to annotate the tail.
  // If the annotation is not splittable it will be deleted.

  var _truncate = function(self, annotation, range) {
    var s1 = annotation.range[0];
    var s2 = range[0];
    var e1 = annotation.range[1];
    var e2 = range[1];

    var newRange;

    // truncate all = delete
    if (s1 >= s2 && e1 <= e2) {
      _delete(self, annotation);

    // truncate the head
    } else if (s1 >= s2  && e1 > e2) {
      newRange = [e2, e1];
      _update(self, annotation, newRange);
    }

    // truncate the tail
    else if (s1 < s2 && e1 <= e2) {
      newRange = [s1, s2];
      _update(self, annotation, newRange);
    }
    // from the middle: split or delete
    else {
      if (self.isSplittable(annotation.type)) {
        newRange = [s1, s2];
        _update(self, annotation, newRange);

        var tailRange = [e2, e1];
        _create(self, annotation.path, annotation.type, tailRange);

      } else {
        _delete(self, annotation);
      }
    }
  };

  // Takes care of updating annotations whenever an graph operation is applied.
  // --------
  // Triggers new events dedicated to annotation changes.
  this.handleOperation = function(op) {

    // TODO: it would be great to have some API to retrieve reflection information for an object operation.

    var typeChain, annotations, annotation;

    if (op.type === "delete" || op.type === "create") {

      typeChain = this.document.schema.typeChain(op.val.type);

      // handle creation or deletion of annotations
      if (typeChain.indexOf("annotation") >= 0) {
        annotation = op.val;
        this.triggerLater("annotation:changed", op.type, annotation);
      }
      // handle deletion of other nodes, i.e., remove associated annotations
      else if (op.type === "delete") {
        annotations = this._index.get(op.path);
        _.each(annotations, function(a) {
          _delete(this, a);
        }, this);
      }
    }

    else if (op.type === "update" || op.type === "set") {

      var node = this.document.get(op.path[0]);

      // FIXME: due to the use of Compunds and the rather late fired property change events
      // it happens, that there arrive atomic operations with the original node being deleted already
      // or should we tolerate this?
      if (node === undefined) {
        return;
      }

      typeChain = this.document.schema.typeChain(node.type);

      if (typeChain.indexOf("annotation") >= 0) {
        // for now we only are interested range updates
        if (op.path[1] !== "range") return;

        this.triggerLater("annotation:changed", "update", node);

      }

      // It turns out that it is not enough to co-transform annotations.
      // E.g., when text gets deleted and the operation is undone
      // the annotation could not be reconstructed.
      // So we have to trigger annotation updates explicitely
      else if (this.withTransformation) {
        this.transform(op);
      }
    }
  };

  this.create = function(annotation) {
    this.document.create(annotation);
    return annotation;
  };

  // Updates all annotations according to a given operation.
  // --------
  //
  // The provided operation is an ObjectOperation which has been applied
  // to the document already.

  // TODO: this needs to be rethought.
  // On the one hand, we need explicit changes to be able to undo e.g. deletions.
  // OTOH, such co-transforms would then be applied twice... i.e., during simulation
  // co-transformation but when applying the simulation we would not want to have them anymore.
  // Also not when redoing changes (as they would be contained in the change).

  var _transform = function(op, annotation) {
        // only apply the transformation on annotations with the same property
    // Note: currently we only have annotations on the `content` property of nodes
    if (!_.isEqual(annotation.path, op.path)) return;

    if (op.type === "update") {
      // Note: these are implicit transformations, i.e., not triggered via annotation controls
      var expandLeft = false;
      var expandRight = false;

      var expandSpec = this.expansion[annotation.type];
      if (expandSpec) {
        if (expandSpec.left) expandLeft =  expandSpec.left(annotation);
        if (expandSpec.right) expandRight = expandSpec.right(annotation);
      }

      var newRange = util.clone(annotation.range);
      var changed = Operator.TextOperation.Range.transform(newRange, op.diff, expandLeft, expandRight);
      if (changed) {
        if (newRange[0] === newRange[1]) {
          _delete(this, annotation);
        } else {
          this.document.set([annotation.id, "range"], newRange);
        }
      }
    }
    // if somebody has reset the property we must delete the annotation
    else if (op.type === "delete" || op.type === "set") {
      _delete(this, annotation);
    }
  };

  this.transform = function(op) {
    var annotations = this._index.get(op.path);
    _.each(annotations, function(a) {
      _transform.call(this, op, a);
    }, this);
  };

  this.paste = function(annotations, newNodeId, offset) {

    for (var i = 0; i < annotations.length; i++) {
      var annotation = annotations[i];
      if (newNodeId !== undefined) {
        annotation.path = _.clone(annotation.path);
        annotation.path[0] = newNodeId;
      }
      if (offset !== undefined) {
        annotation.range[0] += offset;
        annotation.range[1] += offset;
      }
      this.create(annotation);
    }
  };

  // Copy annotations in the given selection.
  // --------
  // This is the pendant to the writer's copy method.
  // Partially selected annotations may not get copied depending on the
  // annotation type, for others, new annotation fragments would be created.

  this.copy = function(selection) {

    var ranges = _getRanges(this, selection);

    // get all affected annotations
    var annotations = this.getAnnotations({selection: selection});
    var result = [];

    _.each(annotations, function(annotation) {

      // TODO: determine if an annotation would be split by the given selection.
      var range = ranges[annotation.path[0]];
      var isPartial = (range[0] > annotation.range[0] || range[1] < annotation.range[1]);

      var newAnnotation;
      if (isPartial) {
        // for the others create a new fragment (depending on type) and truncate the original
        if (this.isSplittable(annotation.type)) {
          newAnnotation = util.clone(annotation);
          // make the range relative to the selection
          newAnnotation.id = util.uuid();
          newAnnotation.range = [Math.max(0, annotation.range[0] - range[0]), annotation.range[1] - range[0]];
          result.push(newAnnotation);
        }
      } else {
        // add totally included ones
        // TODO: need more control over uuid generation
        newAnnotation = util.clone(annotation);
        newAnnotation.id = util.uuid();
        newAnnotation.range = [newAnnotation.range[0] - range[0], newAnnotation.range[1] - range[0]];
        result.push(newAnnotation);
      }

    }, this);

    return result;
  };

  // Retrieve annotations
  // --------
  // The selection can be filtered via
  //
  // - node + range : a node id and (optionally) a given range (only if node is given)
  // - selection: a selection of type `{start: [nodePos, charPos], end: [nodePos, charPos]}`
  // - filter: a custom filter of type `function(annotation) -> boolean`
  //

  this.getAnnotations = function(options) {
    options = options || {};
    if (!options.view) options.view = "content";

    var doc = this.document;

    var annotations = {};

    if (options.node) {
      annotations = _filterByNodeAndRange.call(this, options.view, options.node, options.range);
    }

    else if (options.selection) {
      var sel = options.selection;
      var ranges = sel.getRanges();

      for (var i = 0; i < ranges.length; i++) {
        // Note: pushing an array and do flattening afterwards
        var range = ranges[i];
        _.extend(annotations, _filterByNodeAndRange.call(this, options.view, range.node.id, [range.start, range.end]));
      }

    } else {
      _.each(doc.nodes, function(node) {
        var baseType = doc.schema.baseType(node.type);
        if(baseType === 'annotation') {
          annotations[node.id] = node;
        }
      });
    }

    if (options.filter) {
      var filtered = {};
      _.each(annotations, function(a) {
        if(options.filter(a)) {
          filtered[a.id] = a;
        }
      });
      annotations = filtered;
    }

    return annotations;
  };

  // Returns true if two annotation types are mutually exclusive
  // ---------
  // Currently there is a built-in mechanism which considers two annotations
  // exclusive if they belong to the same group.
  //

  this.isExclusive = function(type1, type2) {
    return this.group[type1] === this.group[type2];
  };

  // Tell if an annotation can be split or should be truncated only.
  // --------
  //
  // E.g. when cutting a selection or inserting a new node existing annotations
  // may be affected. In some cases (e.g., `emphasis` or `strong`) it is wanted
  // that a new annotation of the same type is created for the cut fragment.

  this.isSplittable = function(type) {
    return this.splittable.indexOf(type) >= 0;
  };

  // Creates an annotation for the current selection of given type
  // --------
  //
  // This action may involve more complex co-actions:
  //
  // - toggle delete one or more annotations
  // - truncate one or more annotations
  //
  // TODO: make aware of views (currently "content" is hard-coded)

  this.annotate = function(selection, type, data) {
    var sel = selection.range();
    var node = selection.cursor.node;

    if (sel.start[0] !== sel.end[0]) throw new DocumentError('Multi-node annotations are not supported.');

    var range = [sel.start[1], sel.end[1]];
    var annotations = this.getAnnotations({node: node.id, range: range});

    if (selection.isCollapsed()) {
      // Note: creating annotations without selection is not supported yet
      // TODO: discuss

      // toggle annotations of same type
      _.each(annotations, function(a) {
        if (a.type === type) {
          _delete(this, a);
        }
      }, this);

    } else {

      // truncate all existing annotations of the same type (or group)
      var toggled = false;
      _.each(annotations, function(a) {
        if (this.isExclusive(type, a.type)) {
          _truncate(this, a, range);
          if (type === a.type) toggled = true;
        }
      }, this);

      // create a new annotation
      if (!toggled) {
        return _create(this, [node.id, "content"], type, range, data);
      }
    }
  };
};

Annotator.Prototype.prototype = util.Events;
Annotator.prototype = new Annotator.Prototype();

Annotator.isOnNodeStart = function(a) {
  return a.range[0] === 0;
};

Annotator.isTrue = function() {
  return true;
};

// Creates a shared index for annotations on a given document.
// --------
//

Annotator.createIndex = function(doc) {
  if (doc.indexes["annotations"] === undefined) {
    var options = {
      types: ["annotation"],
      property: "path"
    };
    var index = doc.addIndex("annotations", options);
    index.ENABLE_LOGGING = true;
    doc.indexes["annotations"] = index;
  }
  return doc.indexes["annotations"];
};

// This is a sweep algorithm wich uses a set of ENTER/EXIT entries
// to manage a stack of active elements.
// Whenever a new element is entered it will be appended to its parent element.
// The stack is ordered by the annotation types.
//
// Examples:
//
// - simple case:
//
//       [top] -> ENTER(idea1) -> [top, idea1]
//
//   Creates a new 'idea' element and appends it to 'top'
//
// - stacked ENTER:
//
//       [top, idea1] -> ENTER(bold1) -> [top, idea1, bold1]
//
//   Creates a new 'bold' element and appends it to 'idea1'
//
// - simple EXIT:
//
//       [top, idea1] -> EXIT(idea1) -> [top]
//
//   Removes 'idea1' from stack.
//
// - reordering ENTER:
//
//       [top, bold1] -> ENTER(idea1) -> [top, idea1, bold1]
//
//   Inserts 'idea1' at 2nd position, creates a new 'bold1', and appends itself to 'top'
//
// - reordering EXIT
//
//       [top, idea1, bold1] -> EXIT(idea1)) -> [top, bold1]
//
//   Removes 'idea1' from stack and creates a new 'bold1'
//
var _levels = {
  idea: 1,
  question: 1,
  error: 1,
  link: 1,
  strong: 2,
  emphasis: 2,
  code: 2,
  subscript: 2,
  superscript: 2,
  underline: 2,
  cross_reference: 1,
  figure_reference: 1,
  person_reference: 1,
  contributor_reference: 1,
  citation_reference: 1
};

var ENTER = 1;
var EXIT = -1;

var Fragmenter = function(options) {
  this.levels = options.levels || _levels;
};

Fragmenter.Prototype = function() {

  // Orders sweep events according to following precedences:
  //
  // 1. pos
  // 2. EXIT < ENTER
  // 3. if both ENTER: ascending level
  // 4. if both EXIT: descending level

  var _compare = function(a, b) {
    if (a.pos < b.pos) return -1;
    if (a.pos > b.pos) return 1;

    if (a.mode < b.mode) return -1;
    if (a.mode > b.mode) return 1;

    if (a.mode === ENTER) {
      if (a.level < b.level) return -1;
      if (a.level > b.level) return 1;
    }

    if (a.mode === EXIT) {
      if (a.level > b.level) return -1;
      if (a.level < b.level) return 1;
    }

    return 0;
  };

  var extractEntries = function(annotations) {
    var entries = [];
    _.each(annotations, function(a) {
      var l = this.levels[a.type];

      // ignore annotations that are not registered
      if (l === undefined) {
        return;
      }

      entries.push({ pos : a.range[0], mode: ENTER, level: l, id: a.id, type: a.type });
      entries.push({ pos : a.range[1], mode: EXIT, level: l, id: a.id, type: a.type });
    }, this);
    return entries;
  };

  this.onText = function(/*context, text*/) {};

  // should return the created user context
  this.onEnter = function(/*entry, parentContext*/) {
    return null;
  };

  this.enter = function(entry, parentContext) {
    return this.onEnter(entry, parentContext);
  };

  this.createText = function(context, text) {
    this.onText(context, text);
  };

  this.start = function(rootContext, text, annotations) {
    var entries = extractEntries.call(this, annotations);
    entries.sort(_compare.bind(this));

    var stack = [{context: rootContext, entry: null}];

    var pos = 0;

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];

      // in any case we add the last text to the current element
      this.createText(stack[stack.length-1].context, text.substring(pos, entry.pos));

      pos = entry.pos;
      var level = 1;

      var idx;

      if (entry.mode === ENTER) {
        // find the correct position and insert an entry
        for (; level < stack.length; level++) {
          if (entry.level < stack[level].entry.level) {
            break;
          }
        }
        stack.splice(level, 0, {entry: entry});
      }
      else if (entry.mode === EXIT) {
        // find the according entry and remove it from the stack
        for (; level < stack.length; level++) {
          if (stack[level].entry.id === entry.id) {
            break;
          }
        }
        stack.splice(level, 1);
      }

      // create new elements for all lower entries
      for (idx = level; idx < stack.length; idx++) {
        stack[idx].context = this.enter(stack[idx].entry, stack[idx-1].context);
      }
    }

    // Finally append a trailing text node
    this.createText(rootContext, text.substring(pos));
  };

};
Fragmenter.prototype = new Fragmenter.Prototype();

Annotator.Fragmenter = Fragmenter;

// Export
// ========

module.exports = Annotator;

},{"./document":75,"./selection":77,"substance-data":63,"substance-operator":143,"substance-util":134,"underscore":139}],70:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");

// Document.Clipboard
// ================
//

var Clipboard = function() {
  // Start with an empty document
  // this.content = new Document({id: "clipboard"});
};


Clipboard.Prototype = function() {

  // Get contents from clipboard
  // --------
  // 

  this.setContent = function(content) {
    this.content = content;
  };

  // Get contents from clipboard
  // --------
  // 
  // Depending on the timestamp 

  this.getContent = function() {
    return this.content;
  };
};


Clipboard.Prototype.prototype = util.Events;
Clipboard.prototype = new Clipboard.Prototype();

// Export
// ========

module.exports = Clipboard;

},{"substance-util":134,"underscore":139}],71:[function(require,module,exports){
var DocumentNode = require("./node");

var Composite = function(node, doc) {
  DocumentNode.call(this, node, doc);
};


// Type definition
// -----------------
//

Composite.type = {
  "id": "composite",
  "parent": "content",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Composite.description = {
  "name": "Composite",
  "remarks": [
    "A file reference to an external resource.",
  ],
  "properties": {
  }
};

// Example File
// -----------------
//

Composite.example = {
  "no_example": "yet"
};



Composite.Prototype = function() {

  this.getLength = function() {
    throw new Error("Composite.getLength() is abstract.");
  };

  // Provides the ids of all referenced sub-nodes.
  // -------
  //

  this.getNodes = function() {
    throw new Error("Composite.getNodes() is abstract.");
  };

  // Tells if this composite is can be changed with respect to its children
  // --------
  //

  this.isMutable = function() {
    return false;
  };

  this.insertOperation = function(/*charPos, text*/) {
    return null;
  };

  this.deleteOperation = function(/*startChar, endChar*/) {
    return null;
  };

  // Inserts reference(s) at the given position
  // --------
  //

  this.insertChild = function(/*doc, pos, nodeId*/) {
    throw new Error("This composite is immutable.");
  };

  // Removes a reference from this composite.
  // --------

  this.deleteChild = function(/*doc, nodeId*/) {
    throw new Error("This composite is immutable.");
  };

  // Provides the index of the affected node.
  // --------
  //

  this.getChangePosition = function(op) {
    return 0;
  };

};

Composite.Prototype.prototype = DocumentNode.prototype;
Composite.prototype = new Composite.Prototype();

module.exports = Composite;

},{"./node":76}],72:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Composite = require("./composite");

var Container = function(document, view) {
  this.document = document;
  this.view = view;

  this.treeView = [];
  this.listView = [];

  this.__parents = {};
  this.__composites = {};

  this.rebuild();
};

Container.Prototype = function() {

  var _each = function(iterator, context) {
    var queue = [];
    var i;

    for (i = this.treeView.length - 1; i >= 0; i--) {
      queue.unshift({
        id: this.treeView[i],
        parent: null
      });
    }

    var item, node;
    while(queue.length > 0) {
      item = queue.shift();
      node = this.document.get(item.id);
      if (node instanceof Composite) {
        var children = node.getNodes();
        for (i = children.length - 1; i >= 0; i--) {
          queue.unshift({
            id: children[i],
            parent: node.id,
          });
        }
      }
      iterator.call(context, node, item.parent);
    }
  };

  this.rebuild = function() {

    // clear the list view
    this.treeView.splice(0, this.treeView.length);
    this.listView.splice(0, this.listView.length);

    this.treeView = _.clone(this.view.nodes);
    for (var i = 0; i < this.view.length; i++) {
      this.treeView.push(this.view[i]);
    }

    this.__parents = {};
    this.__composites = {};
    _each.call(this, function(node, parent) {
      if (node instanceof Composite) {
        this.__parents[node.id] = parent;
        this.__composites[parent] = parent;
      } else {
        this.listView.push(node.id);
        if (this.__parents[node.id]) {
          throw new Error("Nodes must be unique in one view.");
        }
        this.__parents[node.id] = parent;
        this.__composites[parent] = parent;
      }
    }, this);
  };

  this.getTopLevelNodes = function() {
    return _.map(this.treeView, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getNodes = function(idsOnly) {
    var nodeIds = this.listView;
    if (idsOnly) {
      return _.clone(nodeIds);
    }
    else {
      var result = [];
      for (var i = 0; i < nodeIds.length; i++) {
        result.push(this.document.get(nodeIds[i]));
      }
      return result;
    }
  };

  this.getPosition = function(nodeId) {
    var nodeIds = this.listView;
    return nodeIds.indexOf(nodeId);
  };

  this.getNodeFromPosition = function(pos) {
    var nodeIds = this.listView;
    var id = nodeIds[pos];
    if (id !== undefined) {
      return this.document.get(id);
    } else {
      return null;
    }
  };

  this.getParent = function(nodeId) {
    return this.__parents[nodeId];
  };

  // Get top level parent of given nodeId
  this.getRoot = function(nodeId) {
    var parent = nodeId;

    // Always use top level element for referenceing the node
    while (parent) {
      nodeId = parent;
      parent = this.getParent(nodeId);
    }
    return nodeId;
  };

  this.update = function(op) {
    var path = op.path;
    var needRebuild = (path[0] === this.view.id ||  this.__composites[path[0]] !== undefined);
    if (needRebuild) this.rebuild();
  };

  this.getLength = function() {
    return this.listView.length;
  };

  // Returns true if there is another node after a given position.
  // --------
  //

  this.hasSuccessor = function(nodePos) {
    var l = this.getLength();
    return nodePos < l - 1;
  };

  // Returns true if given view and node pos has a predecessor
  // --------
  //

  this.hasPredecessor = function(nodePos) {
    return nodePos > 0;
  };

  // Get predecessor node for a given view and node id
  // --------
  //

  this.getPredecessor = function(id) {
    var pos = this.getPosition(id);
    if (pos <= 0) return null;
    return this.getNodeFromPosition(pos-1);
  };

  // Get successor node for a given view and node id
  // --------
  //

  this.getSuccessor = function(id) {
    var pos = this.getPosition(id);
    if (pos >= this.getLength() - 1) return null;
    return this.getNodeFromPosition(pos+1);
  };

  this.firstChild = function(node) {
    if (node instanceof Composite) {
      var first = this.document.get(node.getNodes()[0]);
      return this.firstChild(first);
    } else {
      return node;
    }
  };

  this.lastChild = function(node) {
    if (node instanceof Composite) {
      var last = this.document.get(_.last(node.getNodes()));
      return this.lastChild(last);
    } else {
      return node;
    }
  };

  // Provides a document position which addresses begin of a given node
  // --------
  //

  this.before = function(node) {
    var child = this.firstChild(node);
    var nodePos = this.getPosition(child.id);
    return [nodePos, 0];
  };

  // Provides a document position which addresses the end of a given node
  // --------
  //

  this.after = function(node) {
    var child = this.lastChild(node);
    var nodePos = this.getPosition(child.id);
    var charPos = child.getLength();
    return [nodePos, charPos];
  };

};

Container.prototype = _.extend(new Container.Prototype(), util.Events.Listener);

Object.defineProperties(Container.prototype, {
  "id": {
    get: function() { return this.view.id; }
  },
  "type": {
    get: function() { return this.view.type; }
  },
  "nodes": {
    get: function() { return this.view.nodes; },
    set: function(val) { this.view.nodes = val; }
  }
});

module.exports = Container;

},{"./composite":71,"substance-util":134,"underscore":139}],73:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Operator = require('substance-operator');
var Selection = require("./selection");
var Annotator = require("./annotator");
var Clipboard = require("./clipboard");
var Composite = require('./composite');

// Document.Controller
// -----------------
//
// Provides means for editing and viewing a Substance.Document. It introduces
// a Selection API in order to move a cursor through the document, support
// copy and paste, etc.
//
// Note: it is quite intentional not to expose the full Substance.Document interface
//       to force us to explicitely take care of model adaptations.
//
// Example usage:
//
//     var doc = new Substance.Document();
//     var editor = new Substance.Document.Controller(doc);
//     var editor.insert("Hello World");

var Controller = function(document, options) {
  options = options || {};
  this.view = options.view || 'content';

  this.__document = document;

  this.chronicle = document.chronicle;
  this.annotator = new Annotator(document);

  this.container = document.get(this.view);
  this.selection = new Selection(this.container);
  this.clipboard = new Clipboard();

  // TODO: this needs serious re-thinking...
  // On the one hand, we wan be able to set the cursor after undo or redo.
  // OTOH, we do not want to update the selection on each micro operation.
  // Probably, the best would be to do that explicitely in all cases (also undo/redo)...
  // this.listenTo(document, 'operation:applied', this.updateSelection);
};

Controller.Prototype = function() {

  // Document Facette
  // --------

  this.getNodes = function(idsOnly) {
    return this.container.getNodes(idsOnly);
  };

  this.getContainer = function() {
    return this.container;
  };

  // Given a node id, get position in the document
  // --------
  //

  this.getPosition = function(id, flat) {
    return this.container.getPosition(id, flat);
  };

  this.getNodeFromPosition = function(nodePos) {
    return this.container.getNodeFromPosition(nodePos);
  };

  // See Annotator
  // --------
  //

  this.getAnnotations = function(options) {
    options = options || {};
    options.view = this.view;
    return this.annotator.getAnnotations(options);
  };

  // Delete current selection
  // --------
  //

  this.delete = function(direction) {

    var session = this.startManipulation();
    // var doc = session.doc;
    var sel = session.sel;
    var container = sel.container;

    if (sel.isNull()) return;

    if (sel.isCollapsed()) {
      sel.expand(direction, "char");
    }

    session.deleteSelection();
    session.save();

    if (container.getLength() === 0) {
      this.selection.clear();
    } else {
      // HACK: if the selection is in an invalid state
      // select the previous char (happens when last node is deleted)
      var N = container.listView.length;
      if (sel.cursor.nodePos >= N) {
        var l = container.getNodeFromPosition(N-1).getLength();
        this.selection.set([N-1, l]);
      } else {
        sel.collapse("left");
        this.selection.set(sel);
      }
    }

  };

  // Copy current selection
  // --------
  //

  this.copy = function() {
    console.log("I am sorry. Currently disabled.");
  };


  // Cut current selection from document
  // --------
  //
  // Returns cutted content as a new Substance.Document

  this.cut = function() {
    this.copy();
    this.delete();
  };

  // Paste content from clipboard at current position
  // --------
  //

  this.paste = function() {
    console.log("I am sorry. Currently disabled.");
  };

  // Split
  // --------
  //

  // TODO: pick a better name
  this.modifyNode = function(type, data) {
    this.breakNode();
  };

  this.breakNode = function() {
    if (this.selection.isNull()) {
      console.log("Can not write, as no position has been selected.");
      return;
    }

    var session = this.startManipulation();
    var doc = session.doc;
    var sel = session.sel;
    var container = sel.container;

    if (!sel.isCollapsed()) {
      session.deleteSelection();
    }

    var node = sel.getNodes()[0];
    var nodePos = sel.start[0];
    var charPos = sel.start[1];

    if (node.isBreakable()) {
      var parentId = container.getParent(node.id);

      var newNode;

      if (parentId) {
        var parent = doc.get(parentId);
        if (parent.isBreakable()) {
          var children = parent.getNodes();
          newNode = parent.break(doc, node.id, charPos);
        } else {
          console.log("Node type '"+parent.type+"' is not splittable.");
        }
      } else {
        newNode = node.break(doc, charPos);
        var insertPos = container.treeView.indexOf(node.id)+1;
        doc.show(this.view, newNode.id, insertPos);
      }
    }

    if (newNode) {
      var pos = container.before(newNode);
      sel.set(pos);
    }

    session.save();
    this.selection.set(sel);
  };

  // Based on current selection, insert new node
  // --------
  //

  this.insertNode = function(type, data) {
    console.log("I am sorry. Currently disabled.", type, data);
  };

  // Creates an annotation based on the current position
  // --------
  //

  this.annotate = function(type, data) {
    return this.annotator.annotate(this.selection, type, data);
  };


  this.startManipulation = function() {
    var doc = this.__document.startSimulation();
    new Annotator(doc, {withTransformation: true});
    var sel = new Selection(doc.get(this.view), this.selection);
    return new Controller.ManipulationSession(doc, sel);
  };

  // Inserts text at the current position
  // --------
  //

  this.write = function(text) {
    if (this.selection.isNull()) {
      console.log("Can not write, as no position has been selected.");
      return;
    }

    var session = this.startManipulation();
    var doc = session.doc;
    var sel = session.sel;

    if (!sel.isCollapsed()) {
      session.deleteSelection();
    }

    var node = sel.getNodes()[0];
    var nodePos = sel.start[0];
    var charPos = sel.start[1];

    // TODO: future. This only works for text nodes....

    var update = node.insertOperation(charPos, text);
    if (update) doc.apply(update);

    session.save();
    this.selection.set([nodePos, charPos+text.length]);
  };

  // Delegate getter
  this.get = function() {
    return this.__document.get.apply(this.__document, arguments);
  };

  this.on = function() {
    return this.__document.on.apply(this.__document, arguments);
  };

  this.off = function() {
    return this.__document.off.apply(this.__document, arguments);
  };

  var _updateSelection = function(op) {

    // TODO: this needs a different approach.
    // With compounds, the atomic operation do not directly represent a natural behaviour
    // I.e., the last operation applied does not represent the position which is
    // desired for updating the cursor
    // Probably, we need to handle that behavior rather manually knowing
    // about possible compound types...
    // Maybe we could use the `alias` field of compound operations to leave helpful information...
    // However, we post-pone this task as it is rather cosmetic

    if (!op) return;

    var view = this.view;
    var doc = this.__document;
    var container = this.container;

    function getUpdatedPostion(op) {

      // We need the last update which is relevant to positioning...
      // 1. Update of the content of leaf nodes: ask node for an updated position
      // 2. Update of a reference in a composite node:
      // TODO: fixme. This does not work with deletions.

      // changes to views or containers are always updates or sets
      // as they are properties
      if (op.type !== "update" && op.type !== "set") return;

      // handle changes to the view of nodes
      var node = doc.get(op.path[0]);

      if (!node) {
        console.log("Hmmm... this.should not happen, though.");
        return;
      }

      var nodePos = -1;
      var charPos = -1;

      if (node instanceof Composite) {
        // TODO: there is no good concept yet
      } else if (node.getChangePosition) {
        nodePos = container.getPosition(node.id);
        charPos = node.getChangePosition(op);
      }

      if (nodePos >= 0 && charPos >= 0) {
        return [nodePos, charPos];
      }
    }


    // TODO: actually, this is not yet an appropriate approach to update the cursor position
    // for compounds.
    Operator.Helpers.each(op, function(_op) {
      var pos = getUpdatedPostion(_op);
      if (pos) {
        this.selection.set(pos);
        // breaking the iteration
        return false;
      }
    }, this, "reverse");

  };

  this.undo = function() {
    var op = this.chronicle.rewind();
    _updateSelection.call(this, op);
  };

  this.redo = function() {
    var op = this.chronicle.forward();
    _updateSelection.call(this, op);
  };

};

// Inherit the prototype of Substance.Document which extends util.Events
Controller.prototype = _.extend(new Controller.Prototype(), util.Events.Listener);

// Property accessors for convenient access of primary properties
Object.defineProperties(Controller.prototype, {
  id: {
    get: function() {
      return this.__document.id;
    },
    set: function() { throw "immutable property"; }
  },
  nodeTypes: {
    get: function() {
      return this.__document.nodeTypes;
    },
    set: function() { throw "immutable property"; }
  },
  title: {
    get: function() {
      return this.__document.get('document').title;
    },
    set: function() { throw "immutable property"; }
  },
  updated_at: {
    get: function() {
      return this.__document.get('document').updated_at;
    },
    set: function() { throw "immutable property"; }
  },
  creator: {
    get: function() {
      return this.__document.get('document').creator;
    },
    set: function() { throw "immutable property"; }
  }
});

var ManipulationSession = function(doc, sel) {
  this.doc = doc;
  this.sel = sel;
  this.container = sel.container;
  this.viewId = this.container.view.id;
};

ManipulationSession.Prototype = function() {

  this.save = function() {
    this.doc.save();
  };

  // Joins two succeeding nodes
  // --------
  //

  this.join = function(id1, id2) {
    // TODO: check if node2 is successor of node1

    var doc = this.doc;
    var container = this.container;

    var node1 = doc.get(id1);
    var node2 = doc.get(id2);

    var parentId1 = container.getParent(id1);
    var parentId2 = container.getParent(id2);
    var parent1 = (parentId1) ? doc.get(parentId1) : null;

    // Note: assuming that mutable composites allow joins (e.g., lists), others do not (e.g., figures)
    if (!node1.canJoin(node2) || (parent1 && !parent1.isMutable())) {
      return false;
    }

    node1.join(doc, node2);
    this.deleteNode(node2.id);

    // Note: the previous call might have eliminated the second composite node
    var parent2 = (parentId2) ? doc.get(parentId2) : null;

    // Join composites if this is allowed
    // Note: this is experimental...
    //  currently, this is only used with two succeeding lists
    // .. and not if we join an element of the parent into the child...
    // ... wooo hacky...
    if (parent1 && parent2 &&
      parent1.id !== parent2.id && parent1.canJoin(parent2) &&
      container.getParent(parentId1) !== parentId2) {

      var children1 = parent1.getNodes();
      var children2 = parent2.getNodes();
      var pos = children1.indexOf(id1) + 1;

      // only join if we are at the end of the first composite
      if (pos === children1.length) {
        this.deleteNode(parent2.id);
        for (var i = 0; i < children2.length; i++) {
          parent1.insertChild(doc, pos+i, children2[i]);
        }
      }
    }

    return true;
  };

  // Deletes a node with given id and also takes care of removing it from its parent.
  // --------
  //

  this.deleteNode = function(nodeId) {
    var doc = this.doc;
    var parentId = this.container.getParent(nodeId);
    var parent = (parentId) ? doc.get(parentId) : null;

    if (!parentId) {
      doc.hide(this.viewId, nodeId);
      doc.delete(nodeId);
    }
    else {
      parent.deleteChild(doc, nodeId);
      if (parent.getLength() === 0) {
        this.deleteNode(parent.id);
      }
    }
  };

  this.deleteSelection = function() {

    var self = this;
    var doc = this.doc;
    var sel = this.sel;
    var container = sel.container;
    var ranges = sel.getRanges();
    var tryJoin = (ranges.length > 1 && !ranges[0].isFull() && !_.last(ranges).isFull());

    // Note: this implementation is unfortunately not so easy...
    // Have chosen a recursion approach to achieve an efficient
    // opportunistic top-down deletion algorithm.
    // It is top-down by that it starts deletion from the top-most
    // node that is fully selected.
    // For efficiency, using a 'visited' map to keep track which nodes have been processed already.

    var i = 0;
    var rangeMap = {};
    for (i = 0; i < ranges.length; i++) {
      rangeMap[ranges[i].node.id] = ranges[i];
    }

    var visited = {};

    // Deletes all children nodes and then removes the given composite itself.
    //
    // Note: this gets only called for the top-most composite which are fully selected.
    //
    function deleteComposite(composite) {
      var queue = _.clone(composite.getNodes());
      self.deleteNode(composite.id);
      while(queue.length > 0) {
        var id = queue.shift();
        doc.delete(id);
        visited[id] = true;
      }
      visited[composite.id] = true;
    }

    // Recursive call that finds the top-most fully selected composite
    //

    function processComposite(node) {
      if (visited[node.id] === undefined) {

        var first = container.firstChild(node);
        var firstRange = rangeMap[first.id];
        var last = container.lastChild(node);
        var lastRange = rangeMap[last.id];

        // If the first and the last range is full then this node is selected fully
        // In that case we check the parent recursively
        // and eventually delete nodes

        if (firstRange && lastRange && firstRange.isFull() && lastRange.isFull()) {
          var parentId = container.getParent(node.id);
          if (parentId) {
            processComposite(doc.get(parentId));
          }
          if (!visited[parentId]) {
            deleteComposite(node);
          }
        } else {
          visited[node.id] = false;
        }
      }
      return visited[node.id];
    }


    for (i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      var node = r.node;
      if (visited[node.id]) continue;

      if (r.isFull()) {
        // If there is a parent composite node,
        // do the top-down deletion
        var parentId = container.getParent(node.id);
        if (parentId) {
          processComposite(doc.get(parentId));
        }
        // otherwise, or if the parent was not fully selected
        // delete the node regularly
        if (!visited[parentId]) {
          // TODO: need to check if the node is allowed to be empty
          if (r.node.getLength() === 0) {
            this.deleteNode(node.id);
          } else {
            // FIXME: annotations have to be removed first otherwise
            // the operations are in wrong order and the inverted operation
            // creates annotations before the content is available.
            // This should be done in the text node...
            // We should extract that from the Annotator into helper functions
            // ... and probably get rid of the Annotator soon...
            var op = r.node.deleteOperation(r.start, r.end);
            if (op && !op.isNOP()) {
              doc.apply(op);
            }
            // HACK: delete fully selected nodes after the first range
            if (i > 0) {
              this.deleteNode(node.id);
            }
          }
        }
      }
      // for partial deletions ask the node for an (incremental) operation
      else {
        var op = r.node.deleteOperation(r.start, r.end);
        if (op && !op.isNOP()) {
          doc.apply(op);
        }
      }
    }

    // TODO: Maybe we want to return whether the join has been rejected or not
    if (tryJoin) {
      this.join(ranges[0].node.id, ranges[ranges.length-1].node.id);
    }
  };
};

ManipulationSession.prototype = new ManipulationSession.Prototype();

Controller.ManipulationSession = ManipulationSession;

module.exports = Controller;

},{"./annotator":69,"./clipboard":70,"./composite":71,"./selection":77,"substance-operator":143,"substance-util":134,"underscore":139}],74:[function(require,module,exports){
var _ = require("underscore");
var SRegExp = require("substance-regexp");
var util = require("substance-util");
var errors = util.errors;

var CursorError = errors.define("CursorError");

// Document.Selection.Cursor
// ================
//
// Hi, I'm an iterator, just so you know.

var Cursor = function(container, nodePos, charPos, view) {
  this.container = container;
  this.view = view || 'content';

  this.nodePos = nodePos;
  this.charPos = charPos;

  if (nodePos !== null && !_.isNumber(nodePos)) {
    throw new CursorError("Illegal argument: expected nodePos as number");
  }

  if (charPos !== null && !_.isNumber(charPos)) {
    throw new CursorError("Illegal argument: expected charPos as number");
  }
};


Cursor.Prototype = function() {

  this.copy = function() {
    return new Cursor(this.container, this.nodePos, this.charPos, this.view);
  };

  this.isValid = function() {
    if (this.nodePos === null || this.charPos === null) return false;
    if (this.nodePos < 0 || this.charPos < 0) return false;

    var node = this.container.getNodeFromPosition(this.nodePos);

    if (!node) return false;
    if (this.charPos >= node.getLength()) return false;

    return true;
  };

  this.isRightBound = function() {
    return this.charPos === this.node.getLength();
  };

  this.isLeftBound = function() {
    return this.charPos === 0;
  };

  this.isEndOfDocument = function() {
    return this.isRightBound() && this.nodePos === this.container.getLength()-1;
  };

  this.isBeginOfDocument = function() {
    return this.isLeftBound() && this.nodePos === 0;
  };

  // Return previous node boundary for a given node/character position
  // --------
  //

  this.prevNode = function() {
    if (!this.isLeftBound()) {
      this.charPos = 0;
    } else if (this.nodePos > 0) {
      this.nodePos -= 1;
      this.charPos = this.node.length;
    }
  };

  // Return next node boundary for a given node/character position
  // --------
  //

  this.nextNode = function() {
    if (!this.isRightBound()) {
      this.charPos = this.node.length;
    } else if (this.nodePos < this.container.getLength()-1) {
      this.nodePos += 1;
      this.charPos = 0;
    }
  };

  // Return previous occuring word for a given node/character position
  // --------
  //

  this.prevWord = function() {
    if (!this.node) throw new CursorError('Invalid node position');

    // Cursor is at first position -> move to prev paragraph if there is any
    if (this.isLeftBound()) {
      this.prevChar();
    } else if (this.node.prevWord) {
      this.charPos = this.node.prevWord(this.charPos);
    } else {
      return this.prevChar();
    }
  };

  // Return next occuring word for a given node/character position
  // --------
  //

  this.nextWord = function() {
    if (!this.node) throw new CursorError('Invalid node position');

    // Cursor is a last position -> move to next paragraph if there is any
    if (this.isRightBound()) {
      this.nextChar();
    } else if (this.node.nextWord) {
      this.charPos = this.node.nextWord(this.charPos);
    } else {
      this.nextChar();
    }
  };

  // Return next char, for a given node/character position
  // --------
  //
  // Useful when navigating over paragraph boundaries

  this.nextChar = function() {
    if (!this.node) throw new CursorError('Invalid node position');

    // Last char in paragraph
    if (this.isRightBound()) {
      if (this.nodePos < this.container.getLength()-1) {
        this.nodePos += 1;
        this.charPos = 0;
      }
    } else {
      this.charPos += 1;
    }
  };


  // Return next char, for a given node/character position
  // --------
  //
  // Useful when navigating over paragraph boundaries

  this.prevChar = function() {
    if (!this.node) throw new CursorError('Invalid node position');
    if (this.charPos<0) throw new CursorError('Invalid char position');

    if (this.isLeftBound()) {
      if (this.nodePos > 0) {
        this.nodePos -= 1;
        this.charPos = this.node.getLength();
      }
    } else {
      this.charPos -= 1;
    }
  };

  // Move
  // --------
  //
  // Useful helper to find char,word and node boundaries
  //
  //     find('right', 'char');
  //     find('left', 'word');
  //     find('left', 'node');

  this.move = function(direction, granularity) {
    if (direction === "left") {
      if (granularity === "word") {
        this.prevWord();
      } else if (granularity === "char") {
        this.prevChar();
      } else if (granularity === "node") {
        this.prevNode();
      }
    } else {
      if (granularity === "word") {
        this.nextWord();
      } else if (granularity === "char") {
        this.nextChar();
      } else if (granularity === "node") {
        this.nextNode();
      }
    }
  };

  this.set = function(nodePos, charPos) {
    this.nodePos = nodePos;
    this.charPos = charPos;

    if (nodePos !== null && !_.isNumber(nodePos)) {
      throw new CursorError("Illegal argument: expected nodePos as number");
    }

    if (charPos !== null && !_.isNumber(charPos)) {
      throw new CursorError("Illegal argument: expected charPos as number");
    }

    if (nodePos !== null) {
      if(!_.isNumber(nodePos)) {
        throw new CursorError("Illegal argument: expected nodePos as number");
      }
      var n = this.container.getLength();
      if (nodePos < 0 || nodePos >= n) {
        throw new CursorError("Invalid node position: " + nodePos);
      }
      var node = this.container.getNodeFromPosition(nodePos);
      var l = node.getLength();
      if (charPos < 0 || charPos > l) {
        throw new CursorError("Invalid char position: " + charPos);
      }
    }
  };

  this.position = function() {
    return [this.nodePos, this.charPos];
  };
};

Cursor.prototype = new Cursor.Prototype();

Object.defineProperties(Cursor.prototype, {
  node: {
    get: function() {
      return this.container.getNodeFromPosition(this.nodePos);
    }
  }
});

module.exports = Cursor;

},{"substance-regexp":128,"substance-util":134,"underscore":139}],75:[function(require,module,exports){
"use strict";

// Substance.Document 0.5.0
// (c) 2010-2013 Michael Aufreiter
// Substance.Document may be freely distributed under the MIT license.
// For all details and documentation:
// http://interior.substance.io/modules/document.html


// Import
// ========

var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;
var Data = require("substance-data");
//var Operator = require("substance-operator");
//var Chronicle = require("substance-chronicle");
var Container = require("./container");

// Module
// ========

var DocumentError = errors.define("DocumentError");


// Document
// --------
//
// A generic model for representing and transforming digital documents

var Document = function(options) {
  Data.Graph.call(this, options.schema, options);

  this.containers = {};
};

// Default Document Schema
// --------

Document.schema = {
  // Static indexes
  "indexes": {
  },

  "types": {
    // Specific type for substance documents, holding all content elements
    "content": {
      "properties": {
      }
    },

    "view": {
      "properties": {
        "nodes": ["array", "content"]
      }
    }
  }
};


Document.Prototype = function() {
  var __super__ = util.prototype(this);

  this.getIndex = function(name) {
    return this.indexes[name];
  };

  this.getSchema = function() {
    return this.schema;
  };

  this.create = function(node) {
    __super__.create.call(this, node);
    return this.get(node.id);
  };

  // Delegates to Graph.get but wraps the result in the particular node constructor
  // --------
  //

  this.get = function(path) {
    var node = __super__.get.call(this, path);

    if (!node) return node;

    // Wrap all views in Container instances
    if (node.type === "view") {
      if (!this.containers[node.id]) {
        this.containers[node.id] = new Container(this, node);
      }
      return this.containers[node.id];
    }

    // Wrap all nodes in an appropriate Node instance
    else {
      var nodeSpec = this.nodeTypes[node.type];
      var NodeType = (nodeSpec !== undefined) ? nodeSpec.Model : null;
      if (NodeType && !(node instanceof NodeType)) {
        node = new NodeType(node, this);
        this.nodes[node.id] = node;
      }

      return node;
    }
  };

  // Serialize to JSON
  // --------
  //
  // The command is converted into a sequence of graph commands

  this.toJSON = function() {
    var res = __super__.toJSON.call(this);
    res.id = this.id;
    return res;
  };

  // Hide elements from provided view
  // --------
  //

  this.hide = function(viewId, nodes) {
    var view = this.get(viewId);

    if (!view) {
      throw new DocumentError("Invalid view id: "+ viewId);
    }

    if (_.isString(nodes)) {
      nodes = [nodes];
    }

    var indexes = [];
    _.each(nodes, function(n) {
      var i = view.nodes.indexOf(n);
      if (i>=0) indexes.push(i);
    }, this);

    if (indexes.length === 0) return;

    indexes = indexes.sort().reverse();
    indexes = _.uniq(indexes);

    var container = this.nodes[viewId];
    for (var i = 0; i < indexes.length; i++) {
      container.nodes.slice(indexes[i], 1);
    }
  };

  // Adds nodes to a view
  // --------
  //

  this.show = function(viewId, nodeId, target) {
    if (target === undefined) target = -1;

    var view = this.get(viewId);
    if (!view) {
      throw new DocumentError("Invalid view id: " + viewId);
    }

    var l = view.nodes.length;

    // target index can be given as negative number (as known from python/ruby)
    target = Math.min(target, l);
    if (target<0) target = Math.max(0, l+target+1);

    view.nodes[target] = nodeId;
  };

  this.fromSnapshot = function(data, options) {
    return Document.fromSnapshot(data, options);
  };

  this.uuid = function(type) {
    return type + "_" + util.uuid();
  };
};

Document.Prototype.prototype = Data.Graph.prototype;
Document.prototype = new Document.Prototype();

Document.fromSnapshot = function(data, options) {
  options = options || {};
  options.seed = data;
  return new Document(options);
};


Document.DocumentError = DocumentError;

// Export
// ========

module.exports = Document;

},{"./container":72,"substance-data":63,"substance-util":134,"underscore":139}],76:[function(require,module,exports){
"use strict";

var _ = require("underscore");

// Substance.Node
// -----------------

var Node = function(node, document) {
  this.document = document;
  this.properties = node;
};

// Type definition
// --------
//

Node.type = {
  "parent": "content",
  "properties": {
  }
};

// Define node behavior
// --------
// These properties define the default behavior of a node, e.g., used when manipulating the document.
// Sub-types override these settings
// Note: it is quite experimental, and we will consolidate them soon.

Node.properties = {
  abstract: true,
  immutable: true,
  mergeableWith: [],
  preventEmpty: true,
  allowedAnnotations: []
};

Node.Prototype = function() {

  this.toJSON = function() {
    return _.clone(this.properties);
  };

  // Provides the number of characters contained by this node.
  // --------
  // We use characters as a general concept, i.e., they do not
  // necessarily map to real characters.
  // Basically it is used for navigation and positioning.

  this.getLength = function() {
    throw new Error("Node.getLength() is abstract.");
  };

  // Provides how a cursor would change by an operation
  // --------
  //

  this.getChangePosition = function(op) {
    throw new Error("Node.getCharPosition() is abstract.");
  };

  // Provides an operation that can be used to insert
  // text at the given position.
  // --------
  //

  this.insertOperation = function(charPos, text) {
    throw new Error("Node.insertOperation() is abstract.");
  };

  // Provides an operation that can be used to delete a given range.
  // --------
  //

  this.deleteOperation = function(startChar, endChar) {
    throw new Error("Node.deleteOperation() is abstract.");
  };

  // Note: this API is rather experimental
  // It is used to dynamically control the behavior for modifications
  // e.g., via an editor

  // Can this node be joined with another one?
  // --------

  this.canJoin = function(other) {
    return false;
  };

  // Appends the content of another node
  // --------

  this.join = function(other) {
    throw new Error("Node.join() is abstract.");
  };

  // Can a 'hard-break' be applied to this node?
  // --------

  this.isBreakable = function() {
    return false;
  };

  // Breaks this node at a given position
  // --------

  this.break = function(doc, pos) {
    throw new Error("Node.split() is abstract.");
  };

  this.getAnnotations = function() {
    return this.document.getIndex("annotations").get(this.properties.id);
  };
};

Node.prototype = new Node.Prototype();
Node.prototype.constructor = Node;

Node.defineProperties = function(NodePrototype, properties, readonly) {
  _.each(properties, function(name) {
    var spec = {
      get: function() {
        return this.properties[name];
      }
    }
    if (!readonly) {
      spec["set"] = function(val) {
        this.properties[name] = val;
        return this;
      }
    }
    Object.defineProperty(NodePrototype, name, spec);
  });
};

Node.defineProperties(Node.prototype, ["id", "type"]);

module.exports = Node;

},{"underscore":139}],77:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;
var Cursor = require("./cursor");

var SelectionError = errors.define("SelectionError");

// Document.Selection
// ================
//
// A selection refers to a sub-fragment of a Substance.Document. It holds
// start/end positions for node and character offsets as well as a direction.
//
//     {
//       start: [NODE_POS, CHAR_POS]
//       end: [NODE_POS, CHAR_POS]
//       direction: "left"|"right"
//     }
//
// NODE_POS: Node offset in the document (0 = first node)
// CHAR_POS: Character offset within a textnode (0 = first char)
//
// Example
// --------
//
// Consider a document `doc` consisting of 3 paragraphs.
//
//           0 1 2 3 4 5 6
//     -------------------
//     P0  | a b c d e f g
//     -------------------
//     P1: | h i j k l m n
//     -------------------
//     P2: | o p q r s t u
//
//
// Create a selection operating on that document.
//     var sel = new Substance.Document.Selection(container);
//
//     sel.set({
//       start: [0, 4],
//       end: [1, 2],
//       direction: "right"
//     });
//
// This call results in the following selection:
//
//           0 1 2 3 4 5 6
//     -------------------
//     P0  | a b c d > > >
//     -------------------
//     P1: | > > > k l m n
//     -------------------
//     P2: | o p q r s t u
//

var Selection = function(container, selection) {
  this.container = container;

  this.start = null;
  this.__cursor = new Cursor(container, null, null);

  if (selection) this.set(selection);
};

Selection.Prototype = function() {

  // Get node from position in contnet view
  // --------
  //

  this.__node = function(pos) {
    return this.container.getNodeFromPosition(pos);
  };


  this.copy = function() {
    var copy = new Selection(this.container);
    if (!this.isNull()) copy.set(this);
    return copy;
  };


  // Set selection
  // --------
  //
  // sel: an instanceof Selection
  //      or a document range `{start: [nodePos, charPos], end: [nodePos, charPos]}`
  //      or a document position `[nodePos, charPos]`

  this.set = function(sel) {
    var cursor = this.__cursor;

    if (sel instanceof Selection) {
      this.start = _.clone(sel.start);
      cursor.set(sel.__cursor.nodePos, sel.__cursor.charPos);
    } else if (_.isArray(sel)) {
      this.start = _.clone(sel);
      cursor.set(sel[0], sel[1]);
    } else {
      this.start = _.clone(sel.start);
      cursor.set(sel.end[0], sel.end[1]);
    }
    var start = this.start;

    // being hysterical about the integrity of selections
    var n = this.container.getLength();
    if (start[0] < 0 || start[0] >= n) {
      throw new SelectionError("Invalid node position: " + start[0]);
    }
    var l = this.__node(start[0]).getLength();
    if (start[1] < 0 || start[1] > l) {
      throw new SelectionError("Invalid char position: " + start[1]);
    }

    this.trigger('selection:changed', this.range());
    return this;
  };

  this.clear = function() {
    this.start = null;
    this.__cursor.set(null, null);
    this.trigger('selection:changed', null);
  };

  this.range = function() {
    if (this.isNull()) return null;

    var pos1 = this.start;
    var pos2 = this.__cursor.position();

    if (this.isReverse()) {
      return {
        start: pos2,
        end: pos1
      };
    } else {
      return {
        start: pos1,
        end: pos2
      };
    }
  };

  this.isReverse = function() {
    var cursor = this.__cursor;
    return (cursor.nodePos < this.start[0]) || (cursor.nodePos === this.start[0] && cursor.charPos < this.start[1]);
  };

  // Set cursor to position
  // --------
  //
  // Convenience for placing the single cusor where start=end

  this.setCursor = function(pos) {
    this.__cursor.set(pos[0], pos[1]);
    this.start = pos;
    return this;
  };

  // Get the selection's  cursor
  // --------
  //

  this.getCursor = function() {
    return this.__cursor.copy();
  };

  this.getCursorPosition = function() {
    return [this.__cursor.nodePos, this.__cursor.charPos];
  };

  // Fully selects a the node with the given id
  // --------
  //

  this.selectNode = function(nodeId) {
    var nodePos = this.container.getPosition(nodeId);
    if (nodePos < 0) {
      throw new SelectionError("Node is not visible: " + nodeId);
    }
    var node = this.container.getNodeFromPosition(nodePos);
    this.set({
      start: [nodePos, 0],
      end: [nodePos, node.getLength()]
    });
  };

  // Get predecessor node of a given node pos
  // --------
  //

  this.getPredecessor = function() {
    var nodePos = this.isReverse() ? this.__cursor.nodePos: this.start[0];
    if (nodePos === 0) return null;
    return this.__node(nodePos-1);
  };

  // Get successor node of a given node pos
  // --------
  //

  this.getSuccessor = function() {
    var nodePos = this.isReverse() ? this.start[0] : this.__cursor.nodePos;
    return this.__node(nodePos+1);
  };

  // Check if the given position has a successor
  // --------
  //

  // TODO: is this really necessary? ~> document.hasPredecessor
  this.hasPredecessor = function(nodePos) {
    return nodePos > 0;
  };

  // Check if the given node has a successor
  // --------
  //

  // TODO: is this really necessary? ~> document.hasSuccessor
  this.hasSuccessor = function(nodePos) {
    var l = this.container.getLength();
    return nodePos < l-1;
  };


  // Collapses the selection into a given direction
  // --------
  //

  this.collapse = function(direction) {
    if (direction !== "right" && direction !== "left" && direction !== "start" && direction !== "cursor") {
      throw new SelectionError("Invalid direction: " + direction);
    }

    if (this.isCollapsed() || this.isNull()) return;

    if (direction === "start") {
      this.__cursor.set(this.start[0], this.start[1]);

    } else if (direction === "cursor") {
      this.start[0] = this.__cursor.nodePos;
      this.start[1] = this.__cursor.charPos;

    } else {
      var range = this.range();

      if (this.isReverse()) {
        if (direction === 'left') {
          this.start = range.start;
        } else {
          this.__cursor.set(range.end[0], range.end[1]);
        }
      } else {
        if (direction === 'left') {
          this.__cursor.set(range.start[0], range.start[1]);
        } else {
          this.start = range.end;
        }
      }
    }

    this.trigger('selection:changed', this.range());
  };

  // move selection to position
  // --------
  //
  // Convenience for placing the single cusor where start=end

  this.move = function(direction, granularity) {

    // moving an expanded selection by char collapses the selection
    // and sets the cursor to the boundary of the direction
    if (!this.isCollapsed() && granularity === "char") {
      this.collapse(direction);
    }
    // otherwise the cursor gets moved (together with start)
    else {
      this.__cursor.move(direction, granularity);
      this.start = this.__cursor.position();
    }

    this.trigger('selection:changed', this.range());
  };

  // Expand current selection
  // ---------
  //
  // Selections keep the direction as a state
  // They can either be right-bound or left-bound
  //

  this.expand = function(direction, granularity) {
    // expanding is done by moving the cursor
    this.__cursor.move(direction, granularity);

    this.trigger('selection:changed', this.range());
  };

  // JSON serialization
  // --------
  //

  this.toJSON = function() {
    return this.range();
  };

  // For a given document return the selected nodes
  // --------
  //

  this.getNodes = function() {
    var allNodes = this.container.getNodes();
    if (this.isNull()) return [];
    var range = this.range();

    return allNodes.slice(range.start[0], range.end[0]+1);
  };

  // Derives Range objects for the selection
  // --------
  //

  this.getRanges = function() {
    var ranges = [];

    var sel = this.range();

    for (var i = sel.start[0]; i <= sel.end[0]; i++) {
      var startChar = 0;
      var endChar = null;

      // in the first node search only in the trailing part
      if (i === sel.start[0]) {
        startChar = sel.start[1];
      }

      // in the last node search only in the leading part
      if (i === sel.end[0]) {
        endChar = sel.end[1];
      }

      if (!_.isNumber(endChar)) {
        var node = this.__node(i);
        endChar = node.getLength();
      }
      ranges.push(new Selection.Range(this, i, startChar, endChar));
    }
    return ranges;
  };

  // Returns start node offset
  // --------
  //

  this.startNode = function() {
    return this.isReverse() ? this.__cursor.nodePos : this.start[0];
  };

  // Returns end node offset
  // --------
  //

  this.endNode = function() {
    return this.isReverse() ? this.start[0] : this.__cursor.nodePos;
  };


  // Returns start node offset
  // --------
  //

  this.startChar = function() {
    return this.isReverse() ? this.__cursor.charPos : this.start[1];
  };

  // Returns end node offset
  // --------
  //

  this.endChar = function() {
    return this.isReverse() ? this.start[1] : this.__cursor.charPos;
  };


  // No selection
  // --------
  //
  // Returns true if there's just a single cursor not a selection spanning
  // over 1+ characters

  this.isNull = function() {
    return this.start === null;
  };


  // Collapsed
  // --------
  //
  // Returns true if there's just a single cursor not a selection spanning
  // over 1+ characters

  this.isCollapsed = function() {
    return this.start[0] === this.__cursor.nodePos && this.start[1] === this.__cursor.charPos;
  };


  // Multinode
  // --------
  //
  // Returns true if the selection refers to multiple nodes

  this.hasMultipleNodes = function() {
    return !this.isNull() && (this.startNode() !== this.endNode());
  };

};

Selection.Prototype.prototype = util.Events;
Selection.prototype = new Selection.Prototype();

Object.defineProperties(Selection.prototype, {
  cursor: {
    get: function() {
      return this.__cursor.copy();
    },
    set: function() { throw "immutable property"; }
  }
});

// Document.Selection.Range
// ================
//
// A Document.Selection consists of 1..n Ranges
// Each range belongs to a node in the document
// This allows us to ask the range about the selected text
// or ask if it's partially selected or not
// For example if an image is fully selected we can just delete it

var Range = function(selection, nodePos, start, end) {
  this.selection = selection;
  // The node pos within the document which can range
  // between selection.startNode() and selection.endNode()
  this.nodePos = nodePos;
  this.node = selection.__node(nodePos);
  this.start = start;
  this.end = end;
};

Range.Prototype = function() {

  // Returns true if the range denotes the first range in a selection
  // --------
  //

  this.isFirst = function() {
    return this.nodePos === this.selection.startNode();
  };

  // Returns true if the range denotes the last range in a selection
  // --------
  //

  this.isLast = function() {
    return this.nodePos === this.selection.endNode();
  };

  // Returns true if the range denotes the last range in a selection
  // --------
  //

  this.hasPredecessor = function() {
    return !this.isFirst();
  };

  // Returns true if the range denotes the last range in a selection
  // --------
  //

  this.hasSuccessor = function() {
    return !this.isLast();
  };

  // Returns true if the range is fully enclosed by both a preceding and successing range
  // --------
  //

  this.isEnclosed = function() {
    return this.hasPredecessor() && this.hasSuccessor();
  };

  // Returns true if the range includes the last character of a node
  // --------
  //

  this.isRightBound = function() {
    return this.end === this.node.getLength();
  };

  // Returns true if the range includes the first character of a node
  // --------
  //

  this.isLeftBound = function() {
    return this.start === 0;
  };

  // Returns the length of the range which corresponds to the number of chars contained
  // --------
  //

  this.length = function() {
    return this.end - this.start;
  };

  // Returns the range's content
  // --------
  //

  this.content = function() {
    // TODO: rethink. such ranges will only work for for text nodes
    return this.node.content.slice(this.start, this.end);
  };

  // Returns true if all chars are selected
  // --------
  //

  this.isFull = function() {
    return this.isLeftBound() && this.isRightBound();
  };

  // Returns true if the range includes the first character of a node
  // --------
  //

  this.isPartial = function() {
    return !this.isFull();
  };

};

Range.prototype = new Range.Prototype();

Selection.Range = Range;
Selection.SelectionError = SelectionError;

// Export
// ========

module.exports = Selection;

},{"./cursor":74,"substance-util":134,"underscore":139}],78:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var Operator = require('substance-operator');
var SRegExp = require("substance-regexp");
var ObjectOperation = Operator.ObjectOperation;
var TextOperation = Operator.TextOperation;
var DocumentNode = require("./node");

// Substance.Text
// -----------------
//

var Text = function(node, document) {
  DocumentNode.call(this, node, document);
};


Text.type = {
  "id": "text",
  "parent": "content",
  "properties": {
    "source_id": "Text element source id",
    "content": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Text.description = {
  "name": "Text",
  "remarks": [
    "A simple text fragement that can be annotated. Usually text nodes are combined in a paragraph.",
  ],
  "properties": {
    "content": "Content",
  }
};


// Example Paragraph
// -----------------
//

Text.example = {
  "type": "paragraph",
  "id": "paragraph_1",
  "content": "Lorem ipsum dolor sit amet, adipiscing elit.",
};


Text.Prototype = function() {

  this.getChangePosition = function(op) {
    if (op.path[1] === "content") {
      var lastChange = Operator.Helpers.last(op.diff);
      if (lastChange.isInsert()) {
        return lastChange.pos+lastChange.length();
      } else if (lastChange.isDelete()) {
        return lastChange.pos;
      }
    }
    return -1;
  };

  this.getLength = function() {
    return this.properties.content.length;
  };

  this.insertOperation = function(charPos, text) {
    return ObjectOperation.Update([this.properties.id, "content"],
      TextOperation.Insert(charPos, text));
  };

  this.deleteOperation = function(startChar, endChar) {
    var content = this.properties.content;
    return ObjectOperation.Update([this.properties.id, "content"],
      TextOperation.Delete(startChar, content.substring(startChar, endChar)),
      "string");
  };

  this.prevWord = function(charPos) {

    var content = this.properties.content;

    // Matches all word boundaries in a string
    var wordBounds = new SRegExp(/\b\w/g).match(content);
    var prevBounds = _.select(wordBounds, function(m) {
      return m.index < charPos;
    }, this);

    // happens if there is some leading non word stuff
    if (prevBounds.length === 0) {
      return 0;
    } else {
      return _.last(prevBounds).index;
    }
  };

  this.nextWord = function(charPos) {
    var content = this.properties.content;

    // Matches all word boundaries in a string
    var wordBounds = new SRegExp(/\w\b/g).match(content.substring(charPos));

    // at the end there might be trailing stuff which is not detected as word boundary
    if (wordBounds.length === 0) {
      return content.length;
    }
    // before, there should be some boundaries
    else {
      var nextBound = wordBounds[0];
      return charPos + nextBound.index + 1;
    }
  };

  this.canJoin = function(other) {
    return (other instanceof Text);
  };

  this.join = function(doc, other) {
    var pos = this.properties.content.length;
    var text = other.content;

    doc.update([this.id, "content"], [pos, text]);
    var annotations = doc.indexes["annotations"].get(other.id);

    _.each(annotations, function(anno) {
      doc.set([anno.id, "path"], [this.properties.id, "content"]);
      doc.set([anno.id, "range"], [anno.range[0]+pos, anno.range[1]+pos]);
    }, this);
  };

  this.isBreakable = function() {
    return true;
  };

  this.break = function(doc, pos) {
    var tail = this.properties.content.substring(pos);

    // 1. Create a new node containing the tail content
    var newNode = this.toJSON();
    // letting the textish node override the type of the new node
    // e.g., a 'heading' breaks into a 'paragraph'
    newNode.type = this.splitInto ? this.splitInto : this.properties.type;
    newNode.id = doc.uuid(this.properties.type);
    newNode.content = tail;
    doc.create(newNode);

    // 2. Move all annotations
    var annotations = doc.indexes["annotations"].get(this.properties.id);
    _.each(annotations, function(annotation) {
      if (annotation.range[0] >= pos) {
        doc.set([annotation.id, "path"], [newNode.id, "content"]);
        doc.set([annotation.id, "range"], [annotation.range[0]-pos, annotation.range[1]-pos]);
      }
    });

    // 3. Trim this node's content;
    doc.update([this.properties.id, "content"], TextOperation.Delete(pos, tail))

    // return the new node
    return newNode;
  };

};

Text.Prototype.prototype = DocumentNode.prototype;
Text.prototype = new Text.Prototype();
Text.prototype.constructor = Text;

DocumentNode.defineProperties(Text.prototype, ["content"]);

module.exports = Text;

},{"./node":76,"substance-operator":143,"substance-regexp":128,"underscore":139}],79:[function(require,module,exports){
"use strict";

module.exports = {
  "node": require("./src/node"),
  "composite": require("./src/composite"),
  "text": require("./src/text"),
  "paragraph": require("./src/paragraph"),
  "heading": require("./src/heading"),
  "list": require("./src/list"),
  "codeblock": require("./src/codeblock"),
  "webresource": require("./src/web_resource"),
  "image": require("./src/image"),
  "formula": require("./src/formula"),
  "table": require("./src/table"),
  "figure": require("./src/figure"),
  "collaborator": require("./src/collaborator"),
  "cover": require("./src/cover"),
  "description": require("./src/description")
};

},{"./src/codeblock":82,"./src/collaborator":85,"./src/composite":88,"./src/cover":91,"./src/description":94,"./src/figure":97,"./src/formula":100,"./src/heading":103,"./src/image":106,"./src/list":107,"./src/node":110,"./src/paragraph":113,"./src/table":116,"./src/text":119,"./src/web_resource":122}],80:[function(require,module,exports){
"use strict";

var Text = require("../text/text_node");

var Codeblock = function(node, document) {
  Text.call(this, node, document);
};

// Type definition
// --------

Codeblock.type = {
  "id": "codeblock",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "content": "string"
  }
};

Codeblock.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Codeblock.description = {
  "name": "Codeblock",
  "remarks": [
    "Text in a codeblock is displayed in a fixed-width font, and it preserves both spaces and line breaks"
  ],
  "properties": {
    "content": "Content",
  }
};


// Example Formula
// -----------------
//

Codeblock.example = {
  "type": "codeblock",
  "id": "codeblock_1",
  "content": "var text = \"Sun\";\nvar op1 = Operator.TextOperation.Delete(2, \"n\");\ntext = op2.apply(op1.apply(text));\nconsole.log(text);",
};

Codeblock.Prototype = function() {};

Codeblock.Prototype.prototype = Text.prototype;
Codeblock.prototype = new Codeblock.Prototype();
Codeblock.prototype.constructor = Codeblock;

module.exports = Codeblock;


},{"../text/text_node":120}],81:[function(require,module,exports){
"use strict";

var TextView = require('../text/text_view');

// Substance.Codeblock.View
// ==========================================================================

var CodeblockView = function(node) {
  TextView.call(this, node);

  this.$el.addClass('content-node codeblock');
};

CodeblockView.Prototype = function() {};

CodeblockView.Prototype.prototype = TextView.prototype;
CodeblockView.prototype = new CodeblockView.Prototype();

module.exports = CodeblockView;

},{"../text/text_view":121}],82:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./codeblock"),
  View: require("./codeblock_view")
};

},{"./codeblock":80,"./codeblock_view":81}],83:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Substance.Collaborator
// -----------------
//

var Collaborator = function(node, doc) {
  Node.call(this, node, doc);
};


// Type definition
// -----------------
//

Collaborator.type = {
  "id": "collaborator",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "name": "string", // full author name
    "role": "string",
    "organization": "string",
    "image": "string", // optional
    "email": "string",
    "contribution": "string"
  }
};

// This is used for the auto-generated docs
// -----------------
//

Collaborator.description = {
  "name": "Collaborator",
  "remarks": [
    "Describes an article collaborator such as an author or editor.",
  ],
  "properties": {
    "name": "Full name.",
  }
};

// Example Video
// -----------------
//

Collaborator.example = {
  "id": "collaborator_1",
  "type": "collaborator",
  "role": "author",
  "name": "John Doe",
  "image": "http://john.com/doe.png",
  "email": "a@b.com",
  "contribution": "Revising the article, data cleanup"
};


Collaborator.Prototype = function() {
  this.getAffiliations = function() {
    return _.map(this.properties.affiliations, function(affId) {
      return this.document.get(affId);
    }, this);
  }
};

Collaborator.Prototype.prototype = Node.prototype;
Collaborator.prototype = new Collaborator.Prototype();
Collaborator.prototype.constructor = Collaborator;


// Generate getters
// --------

var getters = {};

var getters = {
  header: {
    get: function() {
      return this.properties.name;
    }
  }
};

_.each(Collaborator.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});


Object.defineProperties(Collaborator.prototype, getters);
module.exports = Collaborator;

},{"substance-document":68,"underscore":139}],84:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;

// Substance.Collaborator.View
// ==========================================================================

var CollaboratorView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node collaborator");
};

CollaboratorView.Prototype = function() {

  // Render it
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Image
    // -------

    if (this.node.image) {
      this.content.appendChild($$('.image', {
        children: [$$('img', {src: this.node.image})]
      }));
    }

    // Organization
    // -------

    // this.content.appendChild($$('.label', {text: 'Organization'}));
    if (this.node.organization) {
      this.content.appendChild($$('.organization', {text: this.node.organization}));  
    }
    

    // Contribution
    // -------

    if (this.node.contribution) {
      this.content.appendChild($$('.label', {text: 'Contribution'}));
      this.content.appendChild($$('.contribution', {text: this.node.contribution}));
    }


    // Email
    // -------

    if (this.node.email) {
      this.content.appendChild($$('.label', {text: 'Email'}));
      this.content.appendChild($$('.email', {
        children: [$$('a', {href: "mailto:"+ this.node.email, text: this.node.email})]
      }));
    }



    return this;
  };

};

CollaboratorView.Prototype.prototype = NodeView.prototype;
CollaboratorView.prototype = new CollaboratorView.Prototype();

module.exports = CollaboratorView;

},{"../node":110,"substance-application":57,"substance-util":134,"underscore":139}],85:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./collaborator"),
  View: require("./collaborator_view")
};

},{"./collaborator":83,"./collaborator_view":84}],86:[function(require,module,exports){
"use strict";

// Note: we leave the Composite in `substance-document` as it is an essential part of the API.
var Document = require("substance-document");
module.exports = Document.Composite;

},{"substance-document":68}],87:[function(require,module,exports){
"use strict";

var NodeView = require("../node").View;

// Substance.Image.View
// ==========================================================================

var CompositeView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass(node.type);
  this.$el.attr('id', this.node.id);

  this.childrenViews = [];
};

CompositeView.Prototype = function() {

  // Rendering
  // =============================
  //

  // Render Markup
  // --------
  //

  this.render = function() {
    this.content = document.createElement("DIV");
    this.content.classList.add("content");

    var i;

    // dispose existing children views if called multiple times
    for (i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }

    // create children views
    var children = this.node.getNodes();
    for (i = 0; i < children.length; i++) {
      var child = this.node.document.get(children[i]);
      var childView = this.viewFactory.createView(child);
      this.content.appendChild(childView.render().el);
      this.childrenViews.push(childView);
    }

    this.el.appendChild(this.content);
    return this;
  };

  this.dispose = function() {
    NodeView.prototype.dispose.call(this);

    for (var i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }
  };

  this.delete = function() {
  };

  this.getCharPosition = function(/*el, offset*/) {
    return 0;
  };

  this.getDOMPosition = function() {
    var content = this.$('.content')[0];
    var range = document.createRange();
    range.setStartBefore(content.childNodes[0]);
    return range;
  };
};

CompositeView.Prototype.prototype = NodeView.prototype;
CompositeView.prototype = new CompositeView.Prototype();

module.exports = CompositeView;

},{"../node":110}],88:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./composite"),
  View: require("./composite_view")
};

},{"./composite":86,"./composite_view":87}],89:[function(require,module,exports){
var _ = require('underscore');
var DocumentNode = require('../node/node');

// Lens.Cover
// -----------------
//

var Cover = function(node, doc) {
  DocumentNode.call(this, node, doc);
};

// Type definition
// -----------------
//

Cover.type = {
  "id": "cover",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "authors": ["array", "person_reference"],
    "image": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Cover.description = {
  "name": "Cover",
  "remarks": [
    "Virtual view on the title and authors of the paper."
  ],
  "properties": {
    "authors": "An array of references to collaborators"
  }
};

// Example Cover
// -----------------
//

Cover.example = {
  "id": "cover",
  "type": "cover",
  "authors": ["collaborator_reference_1", "collaborator_reference_2"]
};

Cover.Prototype = function() {
  this.getAuthorRefs = function() {
    return _.map(this.properties.authors, function(id) {
      return this.document.get(id);
    }, this);
  };
};

Cover.Prototype.prototype = DocumentNode.prototype;
Cover.prototype = new Cover.Prototype();
Cover.prototype.constructor = Cover;

// Generate getters
// --------

Object.defineProperties(Cover.prototype, {
  title: {
    get: function() {
      return this.document.title;
    }
  },
  authors: {
    // Expand author id's to corresponding person nodes
    get: function() {
      return this.properties.authors;
    }
  },
  image: {
    get: function() {
      return this.properties.image;
    }
  }
});

module.exports = Cover;

},{"../node/node":111,"underscore":139}],90:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var NodeView = require("../node/node_view");
var $$ = require("substance-application").$$;


// Lens.Cover.View
// ==========================================================================

var CoverView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node cover");
};

CoverView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);
    var node = this.node;

    if (this.node.document.published_on) {
      this.content.appendChild($$('.published-on', {
        html: new Date(this.node.document.published_on).toDateString()
      }));      
    }


    this.content.appendChild($$('.title', {text: node.title }));


    var authorRefs = this.node.getAuthorRefs();
    if (authorRefs) {
      var authorsEl = document.createElement("DIV");
      authorsEl.classList.add("authors");
      var authorRefEl;
      for (var i = 0; i < authorRefs.length; i++) {
        var ref = authorRefs[i];
        var author = this.node.document.get(ref.target);
        authorRefEl = document.createElement("SPAN");
        // TODO: use data-* attribute to store the referenced collaborator node
        authorRefEl.setAttribute("id", ref.id);
        authorRefEl.classList.add("annotation");
        authorRefEl.classList.add("person_reference");
        authorRefEl.innerHTML = author.name;
        authorsEl.appendChild(authorRefEl);
      }
      this.content.appendChild(authorsEl);
    }

    if (this.node.image) {
      this.el.style.backgroundImage = "url('"+this.node.image+"')"
    }

    return this;
  };
};

CoverView.Prototype.prototype = NodeView.prototype;
CoverView.prototype = new CoverView.Prototype();

module.exports = CoverView;

},{"../node/node_view":112,"substance-application":57,"underscore":139}],91:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./cover":89,"./cover_view":90,"/home/oliver/projects/elife/lens/node_modules/lens-article/nodes/cover/index.js":22}],92:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var Document = require("substance-document");
var DocumentNode = Document.Node;
var Composite = Document.Composite;

var Description = function(node, document) {
  Composite.call(this, node, document);
};

Description.type = {
  "id": "description",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "topic": "text",
    "body": "paragraph"
  }
};

Description.description = {
  "name": "Description",
  "remarks": [
    "A Description consists of two components: a topic and its textual description."
  ],
  "properties": {
    "topic": "The entity to be described",
    "body": "A paragraph containing content which describe the topic",
  }
};

Description.example = {
  "type": "description",
  "id": "description_1",
  "topic": "text_1",
  "body": "paragraph_2"
};

Description.Prototype = function() {

  this.getLength = function() {
    return 2;
  };

  this.getNodes = function() {
    return [this.properties.topic, this.properties.body];
  };

  this.getTopic = function() {
    return this.document.get(this.properties.topic);
  };

  this.getBody = function() {
    return this.document.get(this.properties.body);
  };

};

Description.Prototype.prototype = Composite.prototype;
Description.prototype = new Description.Prototype();
Description.prototype.constructor = Description;

DocumentNode.defineProperties(Description.prototype, ["topic", "body"]);

module.exports = Description;

},{"substance-document":68,"underscore":139}],93:[function(require,module,exports){
"use strict";

var NodeView = require("../node").View;

var DescriptionView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass('description');
  this.$el.attr('id', this.node.id);
};

DescriptionView.Prototype = function() {

  this.render = function() {

    var content = document.createElement('div');
    content.className = 'content';

    var topicEl = document.createElement('div');
    topicEl.className = 'topic';
    var topicView = this.viewFactory.createView(this.node.getTopic());
    topicEl.appendChild(topicView.render().el);
    this._topicEl = topicEl;

    var bodyEl = document.createElement('div');
    bodyEl.className = 'body';
    var bodyView = this.viewFactory.createView(this.node.getBody());
    bodyEl.appendChild(bodyView.render().el);
    this._bodyEl = bodyEl;

    content.appendChild(topicEl);
    content.appendChild(bodyEl);

    this.el.appendChild(content);

    return this;
  };

};

DescriptionView.Prototype.prototype = NodeView.prototype;
DescriptionView.prototype = new DescriptionView.Prototype();

module.exports = DescriptionView;

},{"../node":110}],94:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./description"),
  View: require("./description_view")
};

},{"./description":92,"./description_view":93}],95:[function(require,module,exports){
"use strict";

var Document = require("substance-document");

var Figure = function(node, document) {
  Document.Composite.call(this, node, document);
};

Figure.type = {
  "id": "figure",
  "parent": "content",
  "properties": {
    "url": "string",
    "label": "string",
    "caption": "paragraph"
  }
};

Figure.description = {
  "name": "Figure",
  "remarks": [
    "A figure is a figure is figure."
  ],
  "properties": {
    "label": "Figure label (e.g. Figure 1)",
    "url": "Image url",
    "caption": "A reference to a paragraph that describes the figure",
  }
};

// Example Figure
// -----------------
//

Figure.example = {
  "id": "figure_1",
  "label": "Figure 1",
  "url": "http://example.com/fig1.png",
  "caption": "paragraph_1"
};

Figure.config = {
  "zoomable": true
};

Figure.Prototype = function() {

  this.insertOperation = function(startChar, text) {
    return null;
  };

  this.deleteOperation = function(startChar, endChar) {
    return null;
  };

  this.hasCaption = function() {
    return (!!this.properties.caption);
  };

  this.getNodes = function() {
    var nodes = [];
    if (this.properties.caption) nodes.push(this.properties.caption);
    return nodes;
  };

  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };
};

Figure.Prototype.prototype = Document.Composite.prototype;
Figure.prototype = new Figure.Prototype();
Figure.prototype.constructor = Figure;

// a factory method to create nodes more conveniently
// Supported
//  - id: unique id
//  - url: a relative path or a web URL
//  - caption: a string used as caption
Figure.create = function(data) {

  var result = {};

  var figId = data.id;
  var figure = {
    id: figId,
    type: "figure",
    label: data.label,
    url: data.url
  };

  if (data.caption) {
    var captionId = "caption_" + data.id;
    var caption = {
      id: captionId,
      type: "text",
      content: data.caption
    };
    result[captionId] = caption;
    figure.caption = captionId;
  }

  result[figId] = figure;
  return result;
};

Document.Node.defineProperties(Figure.prototype, ["url", "caption"]);

Object.defineProperties(Figure.prototype, {
  // Used as a resource header
  header: {
    get: function() { return this.properties.label; }
  }
});

module.exports = Figure;

},{"substance-document":68}],96:[function(require,module,exports){
"use strict";

var CompositeView = require("../composite").View;
var $$ = require ("substance-application").$$;

// Substance.Figure.View
// ==========================================================================

var FigureView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

FigureView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.el.innerHTML = "";
    this.content = $$('div.content');

    // Add graphic (img element)
    var imgEl = $$('.image-wrapper', {
      children: [ $$("img", {src: this.node.url}) ]
    });

    this.content.appendChild(imgEl);

    var i;
    // dispose existing children views if called multiple times
    for (i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }

    var caption = this.node.getCaption();
    if (caption) {
      var captionView = this.viewFactory.createView(caption);
      var captionEl = captionView.render().el;
      this.content.appendChild(captionEl);
      this.childrenViews.push(captionView);
    }

    this.el.appendChild(this.content);
    return this;
  };
};

FigureView.Prototype.prototype = CompositeView.prototype;
FigureView.prototype = new FigureView.Prototype();

module.exports = FigureView;

},{"../composite":88,"substance-application":57}],97:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"./figure":95,"./figure_view":96,"/home/oliver/projects/elife/lens/node_modules/lens-article/nodes/figure/index.js":25}],98:[function(require,module,exports){
var _ = require('underscore');
var Node = require('substance-document').Node;

// Formula
// -----------------
//

var Formula = function(node) {
  Node.call(this, node);
};

// Type definition
// -----------------
//

Formula.type = {
  "id": "formula",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "data": "string",
    "format": "string", // MathML, LaTeX, image
    "inline": "boolean"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Formula.description = {
  "name": "Formula",
  "remarks": [
    "Can either be expressed in MathML format or using an image url"
  ],
  "properties": {
    "label": "Formula label (4)",
    "data": "Formula data, either MathML or image url",
    "format": "Can either be `mathml` or `image`"
  }
};


// Example Formula
// -----------------
//

Formula.example = {
  "type": "formula",
  "id": "formula_eqn1",
  "label": "(1)",
  "content": "<mml:mrow>...</mml:mrow>",
  "format": "mathml"
};

Formula.Prototype = function() {
  this.inline = false;
};

Formula.Prototype.prototype = Node.prototype;
Formula.prototype = new Formula.Prototype();
Formula.prototype.constuctor = new Formula;


// Generate getters
// --------

var getters = {};

_.each(Formula.type.properties, function(prop, key) {
  getters[key] = {
    get: function() {
      return this.properties[key];
    }
  };
});

Object.defineProperties(Formula.prototype, getters);

module.exports = Formula;

},{"substance-document":68,"underscore":139}],99:[function(require,module,exports){
"use strict";

var NodeView = require('../node').View;

// FormulaView
// ===========

var FormulaView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass('content-node formula');
  if (this.node.inline) {
    this.$el.addClass('inline');
  }
};

FormulaView.Prototype = function() {

  // Render the formula
  // --------
    
  this.render = function() {

    var format = this.node.format;
    switch (format) {
    case "mathml":
      this.$el.html(this.node.data);

      // This makes the UI freeze when many formulas are in the document.
      // MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
      break;
    case "image":
      this.$el.append('<img src="'+this.node.url+'"/>');
      break;
    case "latex":
      if (this.node.inline) {
        this.$el.html("\\("+this.node.data+"\\)");
      } else {
        this.$el.html("\\["+this.node.data+"\\]");
      }

      // This makes the UI freeze when many formulas are in the document.
      // MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
      break;
    default:
      console.error("Unknown formula format:", format);
    }

    // Add label to block formula
    // --------
    if (this.node.label) {
      this.$el.append($('<div class="label">').html(this.node.label));
    }


    return this;
  };
};

FormulaView.Prototype.prototype = NodeView.prototype;
FormulaView.prototype = new FormulaView.Prototype();

module.exports = FormulaView;

},{"../node":110}],100:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./formula'),
  View: require('./formula_view')
};

},{"./formula":98,"./formula_view":99}],101:[function(require,module,exports){
"use strict";

var DocumentNode = require("substance-document").Node;
var Text = require("../text/text_node");

var Heading = function(node, document) {
  Text.call(this, node, document);
};

// Type definition
// -----------------
//

Heading.type = {
  "id": "heading",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "content": "string",
    "level": "number"
  }
};

// Example Heading
// -----------------
//

Heading.example = {
  "type": "heading",
  "id": "heading_1",
  "content": "Introduction",
  "level": 1
};

// This is used for the auto-generated docs
// -----------------
//


Heading.description = {
  "name": "Heading",
  "remarks": [
    "Denotes a section or sub section in your article."
  ],
  "properties": {
    "content": "Heading content",
    "level": "Heading level. Ranges from 1..4"
  }
};

Heading.Prototype = function() {
  this.splitInto = 'paragraph';
};

Heading.Prototype.prototype = Text.prototype;
Heading.prototype = new Heading.Prototype();
Heading.prototype.constructor = Heading;

DocumentNode.defineProperties(Heading.prototype, ["level"]);

module.exports = Heading;

},{"../text/text_node":120,"substance-document":68}],102:[function(require,module,exports){
"use strict";

var TextView = require('../text/text_view');

// Substance.Heading.View
// ==========================================================================

var HeadingView = function(node) {
  TextView.call(this, node);

  this.$el.addClass('heading');
  this.$el.addClass('level-'+this.node.level);
  this.$el.attr('title', "Click to set anchor. Great for sharing!");
};

HeadingView.Prototype = function() {};

HeadingView.Prototype.prototype = TextView.prototype;
HeadingView.prototype = new HeadingView.Prototype();

module.exports = HeadingView;

},{"../text/text_view":121}],103:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./heading"),
  View: require("./heading_view")
};

},{"./heading":101,"./heading_view":102}],104:[function(require,module,exports){
"use strict";

var DocumentNode = require("substance-document").Node;
var WebResource = require("../web_resource/web_resource");

var ImageNode = function(node, document) {
  WebResource.call(this, node, document);
};

// Type definition
// -----------------
//

ImageNode.type = {
  "id": "image",
  "parent": "webresource",
  "properties": {
    "source_id": "string"
  }
};

// Example Image
// -----------------
//

ImageNode.example = {
  "type": "image",
  "id": "image_1",
  "url": "http://substance.io/image_1.png"
};

// This is used for the auto-generated docs
// -----------------
//


ImageNode.description = {
  "name": "Image",
  "remarks": [
    "Represents a web-resource for an image."
  ],
  "properties": {}
};

ImageNode.Prototype = function() {};

ImageNode.Prototype.prototype = WebResource.prototype;
ImageNode.prototype = new ImageNode.Prototype();
ImageNode.prototype.constructor = ImageNode;

module.exports = ImageNode;

},{"../web_resource/web_resource":123,"substance-document":68}],105:[function(require,module,exports){
"use strict";

var NodeView = require("../node").View;

// Substance.Image.View
// ==========================================================================

var ImageView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass('image');
  this.$el.attr('id', this.node.id);
};

ImageView.Prototype = function() {

  // Rendering
  // =============================
  //

  var _indexOf = Array.prototype.indexOf;

  // Render Markup
  // --------
  //
  // div.content
  //   div.img-char
  //     .img

  this.render = function() {

    var content = document.createElement('div');
    content.className = 'content';

    var imgChar = document.createElement('div');
    imgChar.className = 'image-char';
    this._imgChar = imgChar;

    var img = document.createElement('img');
    img.src = this.node.url;
    img.alt = "alt text";
    img.title = "alt text";
    imgChar.appendChild(img);

    content.appendChild(imgChar);

    // Add content
    this.el.appendChild(content);

    this._imgPos = _indexOf.call(imgChar.childNodes, img);

    return this;
  };

  this.delete = function(pos, length) {
    var content = this.$('.content')[0];
    var spans = content.childNodes;
    for (var i = length - 1; i >= 0; i--) {
      content.removeChild(spans[pos+i]);
    }
  };

  this.getCharPosition = function(el, offset) {
    // TODO: is there a more general approach? this is kind of manually coded.

    if (el === this._imgChar) {
      return (offset > this._imgPos) ? 1 : 0;
    }

    console.log("Errhhh..");

  };

  this.getDOMPosition = function(charPos) {
    var content = this.$('.content')[0];
    var range = document.createRange();
    if (charPos === 0) {
      range.setStartBefore(content.childNodes[0]);
    } else {
      range.setStartAfter(content.childNodes[0]);
    }
    return range;
  };
};

ImageView.Prototype.prototype = NodeView.prototype;
ImageView.prototype = new ImageView.Prototype();

module.exports = ImageView;

},{"../node":110}],106:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./image"),
  View: require("./image_view")
};

},{"./image":104,"./image_view":105}],107:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./list"),
  View: require("./list_view")
};

},{"./list":108,"./list_view":109}],108:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var Document = require("substance-document");
var DocumentNode = Document.Node;
var Composite = Document.Composite;

var List = function(node, document) {
  Composite.call(this, node, document);
};

List.type = {
  "id": "list",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "items": ["array", "paragraph"],
    "ordered": "boolean"
  }
};


// This is used for the auto-generated docs
// -----------------
//

List.description = {
  "name": "List",
  "remarks": [
    "Lists can either be numbered or bullet lists"
  ],
  "properties": {
    "ordered": "Specifies wheter the list is ordered or not",
    "items": "An array of paragraph references",
  }
};


// Example Formula
// -----------------
//

List.example = {
  "type": "list",
  "id": "list_1",
  "items ": [
    "paragraph_listitem_1",
    "paragraph_listitem_2",
  ]
};

List.Prototype = function() {

  this.getLength = function() {
    return this.properties.items.length;
  };

  this.getNodes = function() {
    return _.clone(this.items);
  };

  this.getItems = function() {
    return _.map(this.properties.items, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getChangePosition = function(op) {
    if (op.path[1] === "items") {

      if (op.type === "update") {
        var diff = op.diff;
        if (diff.isInsert()) {
          return op.diff.pos+1;
        }
        else if (diff.isDelete()) {
          return op.diff.pos;
        }
        else if (diff.isMove()) {
          return op.diff.target;
        }
      }
      else if (op.type === "set") {
        return this.properties.items.length-1;
      }
    }

    return -1;
  };

  this.isMutable = function() {
    return true;
  };

  this.insertChild = function(doc, pos, nodeId) {
    doc.update([this.id, "items"], ["+", pos, nodeId]);
  };

  this.deleteChild = function(doc, nodeId) {
    var pos = this.items.indexOf(nodeId);
    doc.update([this.id, "items"], ["-", pos, nodeId]);
    doc.delete(nodeId);
  };

  this.canJoin = function(other) {
    return (other.type === "list");
  };

  this.isBreakable = function() {
    return true;
  };

  this.break = function(doc, childId, charPos) {
    var childPos = this.properties.items.indexOf(childId);
    if (childPos < 0) {
      throw new Error("Unknown child " + childId);
    }
    var child = doc.get(childId);
    var newNode = child.break(doc, charPos);
    doc.update([this.id, "items"], ["+", childPos+1, newNode.id]);
    return newNode;
  };

};

List.Prototype.prototype = Composite.prototype;
List.prototype = new List.Prototype();
List.prototype.constructor = List;

DocumentNode.defineProperties(List.prototype, ["items", "ordered"]);

module.exports = List;

},{"substance-document":68,"underscore":139}],109:[function(require,module,exports){
"use strict";

var CompositeView = require("../composite/composite_view");
var List = require("./list");

// Substance.Image.View
// ==========================================================================

var ListView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

ListView.whoami = "SubstanceListView";


ListView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.el.innerHTML = "";

    var ltype = (this.node.ordered) ? "OL" : "UL";
    this.content = document.createElement(ltype);
    this.content.classList.add("content");

    var i;

    // dispose existing children views if called multiple times
    for (i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }

    // create children views
    var children = this.node.getNodes();
    for (i = 0; i < children.length; i++) {
      var child = this.node.document.get(children[i]);
      var childView = this.viewFactory.createView(child);

      var listEl;
      if (child instanceof List) {
        listEl = childView.render().el;
      } else {
        listEl = document.createElement("LI");
        listEl.appendChild(childView.render().el);
      }
      this.content.appendChild(listEl);
      this.childrenViews.push(childView);
    }

    this.el.appendChild(this.content);
    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id && op.path[1] === "items") {
      this.render();
    }
  };
};

ListView.Prototype.prototype = CompositeView.prototype;
ListView.prototype = new ListView.Prototype();

module.exports = ListView;

},{"../composite/composite_view":87,"./list":108}],110:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./node"),
  View: require("./node_view")
};

},{"./node":111,"./node_view":112}],111:[function(require,module,exports){
"use strict";

// Note: we leave the Node in `substance-document` as it is an essential part of the API.
var Document = require("substance-document");


var Node = Document.Node;

// This is used for the auto-generated docs
// -----------------
//

Node.description = {
  "name": "Node",
  "remarks": [
    "Abstract node type."
  ],
  "properties": {
    "source_id": "Useful for document conversion where the original id of an element should be remembered.",
  }
};

// Example
// -------
//

module.exports = Node;

},{"substance-document":68}],112:[function(require,module,exports){
var View = require("substance-application").View;

// Substance.Node.View
// -----------------

var NodeView = function(node, viewFactory) {
  View.call(this);

  this.node = node;
  this.viewFactory = viewFactory;

  this.$el.addClass('content-node');
  this.$el.attr('id', this.node.id);
};

NodeView.Prototype = function() {

  // Rendering
  // --------
  //

  this.render = function() {
    this.content = document.createElement("DIV");
    this.content.classList.add("content");
    this.el.appendChild(this.content);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };

  // Retrieves the corresponding character position for the given DOM position.
  // --------
  //

  this.getCharPosition = function(/*el, offset*/) {
    throw new Error("NodeView.getCharPosition() is abstract.");
  };

  // Retrieves the corresponding DOM position for a given character.
  // --------
  //

  this.getDOMPosition = function(/*charPos*/) {
    throw new Error("NodeView.getDOMPosition() is abstract.");
  };

  // A general graph update listener that dispatches
  // to `this.onNodeUpdate(op)`
  // --------
  //

  this.onGraphUpdate = function(op) {
    if(op.path[0] === this.node.id && (op.type === "update" || op.type === "set") ) {
      this.onNodeUpdate(op);
    }
  };

  // Callback to get noticed about updates applied to the underlying node.
  // --------
  //

  this.onNodeUpdate = function(/*op*/) {
    // do nothing by default
  };
};

NodeView.Prototype.prototype = View.prototype;
NodeView.prototype = new NodeView.Prototype();

module.exports = NodeView;

},{"substance-application":57}],113:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./paragraph"),
  View: require("./paragraph_view")
};

},{"./paragraph":114,"./paragraph_view":115}],114:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var Document = require("substance-document");
var DocumentNode = Document.Node;
var Composite = Document.Composite;


var Paragraph = function(node, document) {
  Composite.call(this, node, document);
};

Paragraph.type = {
  "id": "paragraph",
  "parent": "content",
  "properties": {
    "children": ["array", "content"]
  }
};

// This is used for the auto-generated docs
// -----------------
//

Paragraph.description = {
  "name": "Paragraph",
  "remarks": [
    "A Paragraph can have inline elements such as images."
  ],
  "properties": {
    "children": "An array of content node references",
  }
};

// Example
// -------
//

Paragraph.example = {
  "type": "paragraph",
  "id": "paragraph_1",
  "children ": [
    "text_1",
    "image_1",
    "text_2"
  ]
};

Paragraph.Prototype = function() {

  this.getLength = function() {
    return this.properties.children.length;
  };

  this.getNodes = function() {
    return _.clone(this.properties.children);
  };

  this.getChildren = function() {
    return _.map(this.properties.children, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getChangePosition = function(op) {
    if (op.path[1] === "children") {

      if (op.type === "update") {
        var diff = op.diff;
        if (diff.isInsert()) {
          return op.diff.pos+1;
        }
        else if (diff.isDelete()) {
          return op.diff.pos;
        }
        else if (diff.isMove()) {
          return op.diff.target;
        }
      }
      else if (op.type === "set") {
        return this.properties.children.length-1;
      }
    }

    return -1;
  };

  this.isMutable = function() {
    return true;
  };

  this.insertChild = function(doc, pos, nodeId) {
    doc.update([this.id, "children"], ["+", pos, nodeId]);
  };

  this.deleteChild = function(doc, nodeId) {
    var pos = this.children.indexOf(nodeId);
    doc.update([this.id, "children"], ["-", pos, nodeId]);
    doc.delete(nodeId);
  };

  this.canJoin = function(other) {
    return (other.type === "paragraph");
  };

  this.isBreakable = function() {
    return true;
  };

  this.break = function(doc, childId, charPos) {
    var childPos = this.properties.children.indexOf(childId);
    if (childPos < 0) {
      throw new Error("Unknown child " + childId);
    }
    var child = doc.get(childId);
    var newNode = child.break(doc, charPos);
    doc.update([this.id, "children"], ["+", childPos+1, newNode.id]);
    return newNode;
  };

};

Paragraph.Prototype.prototype = Composite.prototype;
Paragraph.prototype = new Paragraph.Prototype();
Paragraph.prototype.constructor = Paragraph;

DocumentNode.defineProperties(Paragraph.prototype, ["children"]);

module.exports = Paragraph;

},{"substance-document":68,"underscore":139}],115:[function(require,module,exports){
"use strict";

var CompositeView = require("../composite/composite_view");

// Substance.Image.View
// ==========================================================================

var ParagraphView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

ParagraphView.Prototype = function() {

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id && op.path[1] === "children") {
      this.render();
    }
  };
};

ParagraphView.Prototype.prototype = CompositeView.prototype;
ParagraphView.prototype = new ParagraphView.Prototype();

module.exports = ParagraphView;

},{"../composite/composite_view":87}],116:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./table"),
  View: require("./table_view")
};

},{"./table":117,"./table_view":118}],117:[function(require,module,exports){
"use strict";

var Document = require("substance-document");
var _ = require("underscore");
var DocumentNode = Document.Node;
var Composite = Document.Composite;

var Table = function(node, document) {
  Composite.call(this, node, document);
};

Table.type = {
  "id": "table",
  "parent": "content",
  "properties": {
    "label": "string",
    "source_id": "string",
    "headers": ["array", "content"],
    "cells": ["array", "array", "content"],
    "caption": "content"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Table.description = {
  "name": "Table",
  "remarks": [],
  "properties": {
    "items": "An array of references which contain the content of each cell",
  }
};


// Example Formula
// -----------------
//

Table.example = {
  "type": "table",
  "id": "table_1",
  "headers": ["text_1", "text_2"],
  "cells": [
    ["cell_1_1", "cell_1_2"],
    ["cell_2_1", "cell_2_2"]
  ]
};

Table.Prototype = function() {

  this.getLength = function() {
    var l = 0;
    l += this.properties.headers.length;
    for (var row = 0; row < this.properties.cells.length; row++) {
      var tableRow = this.properties.cells[row];
      l += tableRow.length;
    }
    if (this.properties.caption) {
      l += 1;
    }

    return l;
  };

  this.getNodes = function() {
    var ids = [];
    for (var col = 0; col < this.properties.headers.length; col++) {
      ids.push(this.properties.headers[col]);
    }
    for (var row = 0; row < this.properties.cells.length; row++) {
      var tableRow = this.properties.cells[row];
      ids = ids.concat(tableRow);
    }
    if (this.properties.caption) {
      ids.push(this.properties.caption);
    }
    return ids;
  };

  this.getHeaders = function() {
    return _.map(this.properties.headers, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getCells = function() {
    var children = [];
    for (var i = 0; i < this.properties.cells.length; i++) {
      var rowIds = this.properties.cells[i];
      var row = [];
      for (var j = 0; j < rowIds.length; j++) {
        row.push(this.document.get(rowIds[j]));
      }
      children.push(row);
    }
    return children;
  };

  this.getCaption = function() {
    var caption;
    if (this.properties.caption) {
      caption = this.document.get(this.properties.caption);
    }
    return caption;
  };

  this.getChangePosition = function(/*op*/) {
    // TODO: map to the corresponding cell
    return -1;
  };

  this.isMutable = function() {
    return false;
  };

  this.canJoin = function(/*other*/) {
    return false;
  };

  this.isBreakable = function() {
    return false;
  };

};

Table.Prototype.prototype = Composite.prototype;
Table.prototype = new Table.Prototype();
Table.prototype.constructor = Table;

Table.create = function(data) {
 var result = {};

  var tableId = data.id;
  var table = {
    id: tableId,
    type: "table",
    label: data.label,
    headers: [],
    cells: []
  };

  var id, node;
  if (data.headers) {
    for (var i = 0; i < data.headers.length; i++) {
      var h = data.headers[i];
      id = "th_" + i + "_" + tableId;
      node = {
        id: id,
        type: "text",
        content: h
      };
      result[id] = node;
      table.headers.push(id);
    }
  }

  for (var row = 0; row < data.cells.length; row++) {
    var rowData = data.cells[row];
    var tableRow = [];
    for (var col = 0; col < rowData.length; col++) {
      var cell = rowData[col];
      id = "td_" + "_" + row + "_" + col + "_" + tableId;
      node = {
        id: id,
        type: "text",
        content: cell
      };
      result[id] = node;
      tableRow.push(id);
    }
    table.cells.push(tableRow);
  }

  if (data.caption) {
    id = "caption_"+ tableId;
    node = {
      id: id,
      type: "text",
      content: data.caption
    };
    result[id] = node;
    table.caption = id;
  }

  result[table.id] = table;

  return result;
};

DocumentNode.defineProperties(Table.prototype, ["headers", "cells", "caption"]);

Object.defineProperties(Table.prototype, {
  // Used as a resource header
  header: {
    get: function() { return this.properties.label; }
  }
});

module.exports = Table;

},{"substance-document":68,"underscore":139}],118:[function(require,module,exports){
"use strict";

var CompositeView = require("../composite/composite_view");
var _ = require("underscore");

// TableView
// =========

var TableView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

TableView.Prototype = function() {

  this.render = function() {
    this.el.innerHTML = "";
    this.content = document.createElement("div");
    this.content.classList.add("content");

    // dispose existing children views if called multiple times
    for (var i = 0; i < this.childrenViews.length; i++) {
      this.childrenViews[i].dispose();
    }

    var tableEl = document.createElement("table");

    // table header
    var cellNode, cellView;
    var tableHeaders = this.node.getHeaders();
    var thead = document.createElement("thead");
    if (tableHeaders.length > 0) {
      var rowEl = document.createElement("tr");
      for (var i = 0; i < tableHeaders.length; i++) {
        cellNode = tableHeaders[i];
        cellView = this.viewFactory.createView(cellNode);
        var cellEl = document.createElement("th");
        cellEl.appendChild(cellView.render().el);
        rowEl.appendChild(cellEl);

        this.childrenViews.push(cellView);
      };
      thead.appendChild(rowEl);
    }
    tableEl.appendChild(thead);

    // table rows
    var tableCells = this.node.getCells();
    var tbody = document.createElement("tbody");
    for (var row = 0; row < tableCells.length; row++) {
      var tableRow = tableCells[row];

      var rowEl = document.createElement("tr");
      for (var col = 0; col < tableRow.length; col++) {
        cellNode = tableRow[col];
        cellView = this.viewFactory.createView(cellNode);
        var cellEl = document.createElement("td");
        cellEl.appendChild(cellView.render().el);
        rowEl.appendChild(cellEl);

        this.childrenViews.push(cellView);
      }
      tbody.appendChild(rowEl);
    }
    tableEl.appendChild(tbody);

    this.content.appendChild(tableEl);

    // table caption
    if (this.node.caption) {
      var caption = this.node.getCaption();
      var captionView = this.viewFactory.createView(caption);
      var captionEl = captionView.render().el;
      captionEl.classList.add("caption");
      this.content.appendChild(captionEl);
      this.childrenViews.push(captionView);
    }

    this.el.appendChild(this.content);

    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id) {
      if (op.path[1] === "headers" || op.path[1] === "cells") {
        this.render();
      }
    }
  };
};

TableView.Prototype.prototype = CompositeView.prototype;
TableView.prototype = new TableView.Prototype();
TableView.prototype.constructor = TableView;

module.exports = TableView;

},{"../composite/composite_view":87,"underscore":139}],119:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./text_node"),
  View: require("./text_view")
};

},{"./text_node":120,"./text_view":121}],120:[function(require,module,exports){
"use strict";

// Note: for now, we have left the Text node implementation in substance-document
// as it is by the test-suite there, too.
// Later, we will try to extract helper methods, that makes it easier
// to implement custom textish nodes with annotation support.
var Document = require("substance-document");
module.exports = Document.TextNode;

},{"substance-document":68}],121:[function(require,module,exports){
var _ = require('underscore');
var NodeView = require('../node/node_view');
var Document = require("substance-document");
var Annotator = Document.Annotator;
var $$ = require("substance-application").$$;

// Substance.Text.View
// -----------------
//
// Manipulation interface shared by all textish types (paragraphs, headings)
// This behavior can overriden by the concrete node types

var LAST_CHAR_HACK = false;

var TextView = function(node, options) {
  NodeView.call(this, node);

  options = options || {};

  // HACK: this is messy and will be cleaner after updating lens to a more current Substance version

  this.path = options.path || [ node.id, 'content' ];
  this.property = node.document.resolve(this.path)

  if (options.classes) {
    this.$el.addClass(options.classes);
  } else {
    this.$el.addClass('content-node text');
  }
  if (!options.path) {
    this.$el.attr('id', this.node.id);
  }

  this._annotations = {};
};

TextView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function(enhancer) {
    NodeView.prototype.render.call(this, enhancer);

    this.renderContent();
    return this;
  };


  this.dispose = function() {
    NodeView.prototype.dispose.call(this);
    console.log('disposing paragraph view');
  };

  this.renderContent = function() {
    this.content.innerHTML = "";

    this._annotations = this.node.document.getIndex("annotations").get(this.path);
    this.renderWithAnnotations(this._annotations);
  };

  this.insert = function(pos, str) {
    var range = this.getDOMPosition(pos);
    var textNode = range.startContainer;
    var offset = range.startOffset;
    var text = textNode.textContent;
    text = text.substring(0, offset) + str + text.substring(offset);
    textNode.textContent = text;
  };

  this.delete = function(pos, length) {
    var range = this.getDOMPosition(pos);
    var textNode = range.startContainer;
    var offset = range.startOffset;
    var text = textNode.textContent;
    text = text.substring(0, offset) + text.substring(offset+length);
    textNode.textContent = text;
  };

  this.onNodeUpdate = function(op) {
    if (op.type === "update") {
      var update = op.diff;
      if (update.isInsert()) {
        this.insert(update.pos, update.str);
      } else if (update.isDelete()) {
        this.delete(update.pos, update.str.length);
      }
    } else if (op.type === "set") {
      this.renderContent();
    }
  };

  this.onGraphUpdate = function(op) {
    if(_.isEqual(op.path, this.path) && (op.type === "update" || op.type === "set") ) {
      this.onNodeUpdate(op);
    }

    var doc = this.node.document;
    var schema = doc.getSchema();

    var node;
    if (op.type !== "delete") {
      node = doc.get(op.path[0]);
    } else {
      node = op.val;
    }
    if (schema.isInstanceOf(node.type, "annotation")) {
      var rerender = false;
      if (node.path[0] === this.node.id) {
        rerender = true;
      } else if (op.type === "set" && op.path[1] === "path" && op.original[0] === this.node.id) {
        rerender = true;
      }

      if (rerender) {
        console.log("Rerendering TextView due to annotation update", op);
        this.renderContent();
      }
    }
  };

  this.getCharPosition = function(el, offset) {
    // TODO: this is maybe too naive
    // lookup the given element and compute a
    // the corresponding char position in the plain document
    var range = document.createRange();
    range.setStart(this.content.childNodes[0], 0);
    range.setEnd(el, offset);
    var str = range.toString();
    var charPos = Math.min(this.property.get().length, str.length);

    // console.log("Requested char pos: ", charPos, this.node.content[charPos]);

    return charPos;
  };

  // Returns the corresponding DOM element position for the given character
  // --------
  //
  // A DOM position is specified by a tuple of element and offset.
  // In the case of text nodes it is a TEXT element.

  this.getDOMPosition = function(charPos) {
    if (this.content === undefined) {
      throw new Error("Not rendered yet.");
    }

    var range = document.createRange();

    if (this.property.get().length === 0) {
      range.setStart(this.content.childNodes[0], 0);
      return range;
    }

    // otherwise look for the containing node in DFS order
    // TODO: this could be optimized using some indexing or caching?
    var stack = [this.content];
    while(stack.length > 0) {
      var el = stack.pop();
      if (el.nodeType === Node.TEXT_NODE) {
        var text = el;
        if (text.length >= charPos) {
          range.setStart(el, charPos);
          return range;
        } else {
          charPos -= text.length;
        }
      } else if (el.childNodes.length > 0) {
        // push in reverse order to have a left bound DFS
        for (var i = el.childNodes.length - 1; i >= 0; i--) {
          stack.push(el.childNodes[i]);
        }
      }
    }

    console.log("Bug-Alarm: the model and the view are out of sync.");
    console.log("The model as "+charPos+" more characters");
    console.log("Returning the last available position... but please fix me. Anyone?");

    var children = this.content.childNodes;
    var last = children[children.length-1];
    range.setStart(last, last.length);

    return range;
  };

  this.createAnnotationElement = function(entry) {
    var el;
    if (entry.type === "link") {
      el = $$('a.annotation.'+entry.type, {
        id: entry.id,
        href: this.node.document.get(entry.id).url // "http://zive.at"
      });
    } else {
      el = $$('span.annotation.'+entry.type, {
        id: entry.id
      });
    }

    return el;
  };

  this.renderWithAnnotations = function(annotations) {
    var that = this;
    var text = this.property.get();
    var fragment = document.createDocumentFragment();

    // this splits the text and annotations into smaller pieces
    // which is necessary to generate proper HTML.
    var fragmenter = new Annotator.Fragmenter({});

    fragmenter.onText = function(context, text) {
      context.appendChild(document.createTextNode(text));
    };

    fragmenter.onEnter = function(entry, parentContext) {
      var el = that.createAnnotationElement(entry);
      parentContext.appendChild(el);
      return el;
    };

    // this calls onText and onEnter in turns...
    fragmenter.start(fragment, text, annotations);

    // EXPERIMENTAL HACK:
    // append a trailing white-space to improve the browser's behaviour with softbreaks at the end
    // of a node.
    if (LAST_CHAR_HACK) {
      fragment.appendChild(document.createTextNode(" "));
    }

    // set the content
    this.content.innerHTML = "";
    this.content.appendChild(fragment);
  };

  // Free the memory
  // --------

  this.dispose = function() {
    this.stopListening();
  };
};

TextView.Prototype.prototype = NodeView.prototype;
TextView.prototype = new TextView.Prototype();

module.exports = TextView;

},{"../node/node_view":112,"substance-application":57,"substance-document":68,"underscore":139}],122:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./web_resource"),
  View: require("./web_resource_view")
};

},{"./web_resource":123,"./web_resource_view":124}],123:[function(require,module,exports){
"use strict";

var DocumentNode = require("substance-document").Node;

var WebResource = function(node, doc) {
  DocumentNode.call(this, node, doc);
};

WebResource.type = {
  "id": "webresource",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "url": "string"
  }
};

WebResource.description = {
  "name": "WebResource",
  "description": "A resource which can be accessed via URL",
  "remarks": [
    "This element is a parent for several other nodes such as Image."
  ],
  "properties": {
    "url": "URL to a resource",
  }
};


WebResource.example = {
  "type": "webresource",
  "id": "webresource_3",
  "url": "http://elife.elifesciences.org/content/elife/1/e00311/F3.medium.gif"
};

WebResource.Prototype = function() {};

WebResource.Prototype.prototype = DocumentNode.prototype;
WebResource.prototype = new WebResource.Prototype();
WebResource.prototype.constructor = WebResource;

DocumentNode.defineProperties(WebResource.prototype, ["url"]);

module.exports = WebResource;

},{"substance-document":68}],124:[function(require,module,exports){
"use strict";

module.exports = require("../node").View;

},{"../node":110}],125:[function(require,module,exports){
"use strict";

var Reader = {
  Controller: require("./src/reader_controller"),
  View: require("./src/reader_view")
};

module.exports = Reader;
},{"./src/reader_controller":126,"./src/reader_view":127}],126:[function(require,module,exports){
"use strict";

var Document = require("substance-document");
var Controller = require("substance-application").Controller;
var ReaderView = require("./reader_view");
var util = require("substance-util");

// Reader.Controller
// -----------------
//
// Controls the Reader.View

var ReaderController = function(doc, state, options) {

  // Private reference to the document
  this.__document = doc;

  // E.g. context information
  this.options = options || {};

  // Reader state
  // -------

  this.content = new Document.Controller(doc, {view: "content"});

  if (doc.get('figures')) {
    this.figures = new Document.Controller(doc, {view: "figures"});
  }

  if (doc.get('citations')) {
    this.citations = new Document.Controller(doc, {view: "citations"});
  }

  if (doc.get('info')) {
    this.info = new Document.Controller(doc, {view: "info"});
  }

  if (doc.get('definitions')) {
    this.definitions = new Document.Controller(doc, {view: "definitions"});
  }

  this.state = state;

  // Current explicitly set context
  this.currentContext = "toc";

};

ReaderController.Prototype = function() {

  this.createView = function() {
    if (!this.view) this.view = new ReaderView(this);
    return this.view;
  };

  // Explicit context switch
  // --------
  // 

  this.switchContext = function(context) {
    // Remember scrollpos of previous context
    this.currentContext = context;

    this.modifyState({
      context: context,
      node: null,
      resource: null
    });
  };

  this.modifyState = function(state) {
    Controller.prototype.modifyState.call(this, state);
  };

  // TODO: Transition to ao new solid API
  // --------
  // 

  this.getActiveControllers = function() {
    var result = [];
    result.push(["article", this]);
    result.push(["reader", this.content]);
    return result;
  };
};


ReaderController.Prototype.prototype = Controller.prototype;
ReaderController.prototype = new ReaderController.Prototype();

module.exports = ReaderController;

},{"./reader_view":127,"substance-application":57,"substance-document":68,"substance-util":134}],127:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var Surface = require("substance-surface");
var Outline = require("lens-outline");
var View = require("substance-application").View;
var TOC = require("substance-toc");
var Data = require("substance-data");
var Index = Data.Graph.Index;
var $$ = require("substance-application").$$;

var CORRECTION = -100; // Extra offset from the top


var addResourceHeader = function(docCtrl, nodeView) {
  var node = nodeView.node;
  var typeDescr = node.constructor.description;

  // Don't render resource headers in info panel (except for contributor nodes)
  // TODO: Do we really need 'collaborator'?
  if (docCtrl.view === "info" && node.type !== "contributor" && node.type !== "collaborator") {
    return;
  }

  var children = [
    $$('a.name', {
      href: "#",
      text: node.header ,
      "sbs-click": "toggleResource("+node.id+")"
    })
  ];

  var config = node.constructor.config;
  if (config && config.zoomable) {
    children.push($$('a.toggle-fullscreen', {
      "href": "#",
      "html": "<i class=\"icon-resize-full\"></i><i class=\"icon-resize-small\"></i>",
      "sbs-click": "toggleFullscreen("+node.id+")"
    }));
  }

  children.push($$('a.toggle-res', {
    "href": "#",
    "sbs-click": "toggleResource("+node.id+")",
    "html": "<i class=\"icon-eye-open\"></i><i class=\"icon-eye-close\"></i>"
  }));

  var resourceHeader = $$('.resource-header', {
    children: children
  });
  nodeView.el.insertBefore(resourceHeader, nodeView.content);
};


// Renders the reader view
// --------
// 
// .document
// .context-toggles
//   .toggle-toc
//   .toggle-figures
//   .toggle-citations
//   .toggle-info
// .resources
//   .toc
//   .surface.figures
//   .surface.citations
//   .info

var Renderer = function(reader) {

  var frag = document.createDocumentFragment();

  // Prepare doc view
  // --------

  var docView = $$('.document');
  docView.appendChild(reader.contentView.render().el);

  // Prepare context toggles
  // --------

  var children = [];


  //  && reader.tocView.headings.length > 2
  if (reader.tocView) {
    children.push($$('a.context-toggle.toc', {
      'href': '#',
      'sbs-click': 'switchContext(toc)',
      'title': 'Text',
      'html': '<i class="icon-align-left"></i><span> Text</span><div class="label">Contents</div>'
    }));
  }

  if (reader.figuresView) {
    children.push($$('a.context-toggle.figures', {
      'href': '#',
      'sbs-click': 'switchContext(figures)',
      'title': 'Figures',
      'html': '<i class="icon-picture"></i><span> Figures</span><div class="label">Figures</div>'
    }));
  }

  if (reader.citationsView) {
    children.push($$('a.context-toggle.citations', {
      'href': '#',
      'sbs-click': 'switchContext(citations)',
      'title': 'Citations',
      'html': '<i class="icon-link"></i><span> Citations</span><div class="label">Citations</div>'
    }));
  }

  if (reader.definitionsView) {
    children.push($$('a.context-toggle.definitions', {
      'href': '#',
      'sbs-click': 'switchContext(definitions)',
      'title': 'Glossary',
      'html': '<i class="icon-book"></i><span>Glossary</span><div class="label">Glossary</div>'
    }));
  }

  if (reader.infoView) {
    children.push($$('a.context-toggle.info', {
      'href': '#',
      'sbs-click': 'switchContext(info)',
      'title': 'Article Info',
      'html': '<i class="icon-info-sign"></i><span>Info</span><div class="label">Info</div>'
    }));
  }




  var contextToggles = $$('.context-toggles', {
    children: children
  });


  // Prepare resources view
  // --------

  var medialStrip = $$('.medial-strip');

  var collection = reader.readerCtrl.options.collection
  if (collection) {
    medialStrip.appendChild($$('a.back-nav', {
      'href': collection.url,
      'title': 'Go back',
      'html': '<i class=" icon-chevron-up"></i>'
    }));
  }

  medialStrip.appendChild($$('.separator-line'));
  medialStrip.appendChild(contextToggles);

  frag.appendChild(medialStrip);
  
  // Wrap everything within resources view
  var resourcesView = $$('.resources');


  // resourcesView.appendChild(medialStrip);
  

  // Add TOC
  // --------
 
  resourcesView.appendChild(reader.tocView.render().el);

  if (reader.figuresView) {
    resourcesView.appendChild(reader.figuresView.render().el);
  }
  
  if (reader.citationsView) {
    resourcesView.appendChild(reader.citationsView.render().el);
  }

  if (reader.definitionsView) {
    resourcesView.appendChild(reader.definitionsView.render().el);
  }

  if (reader.infoView) {
    resourcesView.appendChild(reader.infoView.render().el);
  }

  frag.appendChild(docView);
  frag.appendChild(resourcesView);
  return frag;
};


// Lens.Reader.View
// ==========================================================================
//

var ReaderView = function(readerCtrl) {
  View.call(this);

  // Controllers
  // --------

  this.readerCtrl = readerCtrl;

  var doc = this.readerCtrl.content.__document;

  this.$el.addClass('article');
  this.$el.addClass(doc.schema.id); // Substance article or lens article?

  // Stores latest body scroll positions per context
  // Only relevant
  this.bodyScroll = {};

  var ArticleRenderer = this.readerCtrl.content.__document.constructor.Renderer;

  // Surfaces
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.contentView = new Surface(this.readerCtrl.content, {
    editable: false,
    renderer: new ArticleRenderer(this.readerCtrl.content, {
      // afterRender: addFocusControls
    })
  });

  // Table of Contents 
  // --------

  this.tocView = new TOC(this.readerCtrl);

  this.tocView.$el.addClass('resource-view');

  // A Surface for the figures view
  if (this.readerCtrl.figures && this.readerCtrl.figures.get('figures').nodes.length) {
    this.figuresView = new Surface(this.readerCtrl.figures, {
      editable: false,
      renderer: new ArticleRenderer(this.readerCtrl.figures, {
        afterRender: addResourceHeader
      })
    });
    this.figuresView.$el.addClass('resource-view');
  }

  // A Surface for the citations view
  if (this.readerCtrl.citations && this.readerCtrl.citations.get('citations').nodes.length) {
    this.citationsView = new Surface(this.readerCtrl.citations, {
      editable: false,
      renderer: new ArticleRenderer(this.readerCtrl.citations, {
        afterRender: addResourceHeader
      })
    });
    this.citationsView.$el.addClass('resource-view');
  }


  // A Surface for the definitions View
  if (this.readerCtrl.definitions && this.readerCtrl.definitions.get('definitions').nodes.length) {
    this.definitionsView = new Surface(this.readerCtrl.definitions, {
      editable: false,
      renderer: new ArticleRenderer(this.readerCtrl.definitions, {
        afterRender: addResourceHeader
      })
    });
    this.definitionsView.$el.addClass('resource-view');
  }

  // A Surface for the info view
  if (this.readerCtrl.info && this.readerCtrl.info.get('info').nodes.length) {
    this.infoView = new Surface(this.readerCtrl.info, {
      editable: false,
      renderer: new ArticleRenderer(this.readerCtrl.info, {
        afterRender: addResourceHeader
      })
    });
    this.infoView.$el.addClass('resource-view');
  }

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);


  // Keep an index for resources
  this.resources = new Index(this.readerCtrl.__document, {
    types: ["figure_reference", "citation_reference", "contributor_reference", "definition_reference"],
    property: "target"
  });


  // Outline
  // --------

  this.outline = new Outline(this.contentView);


  // Resource Outline
  // --------

  this.resourcesOutline = new Outline(this.figuresView);

  // DOM Events
  // --------
  // 

  this.contentView.$el.on('scroll', _.bind(this.onContentScroll, this));

  // Resource content that is being scrolled
  if (this.figuresView) this.figuresView.$el.on('scroll', _.bind(this.onResourceContentScroll, this));
  if (this.citationsView) this.citationsView.$el.on('scroll', _.bind(this.onResourceContentScroll, this));
  if (this.definitionsView) this.definitionsView.$el.on('scroll', _.bind(this.onResourceContentScroll, this));
  if (this.infoView) this.infoView.$el.on('scroll', _.bind(this.onResourceContentScroll, this));

  // Resource references
  this.$el.on('click', '.annotation.figure_reference', _.bind(this.toggleFigureReference, this));
  this.$el.on('click', '.annotation.citation_reference', _.bind(this.toggleCitationReference, this));
  this.$el.on('click', '.annotation.contributor_reference', _.bind(this.toggleContributorReference, this));
  this.$el.on('click', '.annotation.definition_reference', _.bind(this.toggleDefinitionReference, this));

  this.$el.on('click', '.annotation.cross_reference', _.bind(this.followCrossReference, this));

  this.$el.on('click', '.document .content-node.heading', _.bind(this.setAnchor, this));
  
  this.$el.on('click', '.document .content-node.heading .top', _.bind(this.gotoTop, this));

  this.outline.$el.on('click', '.node', _.bind(this._jumpToNode, this));

};


ReaderView.Prototype = function() {
  
  this.setAnchor = function(e) {
    this.toggleNode('toc', $(e.currentTarget).attr('id'));
  };

  this.gotoTop = function() {
    // Jump to cover node as that's easiest
    this.jumpToNode("cover");
    $(document).scrollTop(0);
    return false;
  }

  // Toggles on and off the zoom
  // --------
  // 

  this.toggleFullscreen = function(resourceId) {
    var state = this.readerCtrl.state;

    // Always activate the resource
    this.readerCtrl.modifyState({
      resource: resourceId,
      fullscreen: !state.fullscreen
    });
  };

  this._jumpToNode = function(e) {
    var nodeId = $(e.currentTarget).attr('id').replace("outline_", "");
    this.jumpToNode(nodeId);
    return false;
  };

  // Toggle Resource Reference
  // --------
  //

  this.toggleFigureReference = function(e) {
    this.toggleResourceReference('figures', e);
    e.preventDefault();
  };

  this.toggleDefinitionReference = function(e) {
    this.toggleResourceReference('definitions', e);
    e.preventDefault();
  };

  this.toggleCitationReference = function(e) {
    this.toggleResourceReference('citations', e);
    e.preventDefault();
  };

  this.toggleContributorReference = function(e) {
    this.toggleResourceReference('info', e);
    e.preventDefault();
  };

  this.toggleResourceReference = function(context, e) {
    var state = this.readerCtrl.state;
    var aid = $(e.currentTarget).attr('id');
    var a = this.readerCtrl.__document.get(aid);

    var nodeId = this.readerCtrl.content.container.getRoot(a.path[0]);
    var resourceId = a.target;

    if (resourceId === state.resource) {
      this.readerCtrl.modifyState({
        context: this.readerCtrl.currentContext,
        node: null,
        resource:  null
      });
    } else {
      this.saveScroll();
      this.readerCtrl.modifyState({
        context: context,
        node: nodeId,
        resource: resourceId
      });

      this.jumpToResource(resourceId);
    }
  };

  // Follow cross reference
  // --------
  //

  this.followCrossReference = function(e) {
    var aid = $(e.currentTarget).attr('id');
    var a = this.readerCtrl.__document.get(aid);
    this.jumpToNode(a.target);
  };


  // On Scroll update outline and mark active heading
  // --------
  //

  this.onContentScroll = function() {
    var scrollTop = this.contentView.$el.scrollTop();
    this.outline.updateVisibleArea(scrollTop);
    this.markActiveHeading(scrollTop);
  };

  this.onResourceContentScroll = function() {
    var scrollTop = this.resourcesOutline.surface.$el.scrollTop();
    this.resourcesOutline.updateVisibleArea(scrollTop);
  };


  // Clear selection
  // --------
  //

  this.markActiveHeading = function(scrollTop) {
    var contentHeight = $('.nodes').height();

    // No headings?
    if (this.tocView.headings.length === 0) return;

    // Use first heading as default
    var activeNode = _.first(this.tocView.headings).id;

    this.contentView.$('.content-node.heading').each(function() {
      if (scrollTop >= $(this).position().top + CORRECTION) {
        activeNode = this.id;
      }
    });

    // Edge case: select last item (once we reach the end of the doc)
    if (scrollTop + this.contentView.$el.height() >= contentHeight) {
      activeNode = _.last(this.tocView.headings).id;
    }
    this.tocView.setActiveNode(activeNode);
  };

  // Toggle on-off a resource
  // --------
  //

  this.toggleResource = function(id) {
    var state = this.readerCtrl.state;
    var node = state.node;
    // Toggle off if already on
    if (state.resource === id) {
      id = null;
      node = null;
    }

    this.readerCtrl.modifyState({
      fullscreen: false,
      resource: id,
      node: node
    });
  };

  // Jump to the given node id
  // --------
  //

  this.jumpToNode = function(nodeId) {
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top+CORRECTION;
      this.contentView.$el.scrollTop(topOffset);
    }
  };

  // Jump to the given resource id
  // --------
  //

  this.jumpToResource = function(nodeId) {
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top;

      // TODO: Brute force for now
      // Make sure to find out which resource view is currently active
      if (this.figuresView) this.figuresView.$el.scrollTop(topOffset);
      if (this.citationsView) this.citationsView.$el.scrollTop(topOffset);
      if (this.definitionsView) this.definitionsView.$el.scrollTop(topOffset);
      if (this.infoView) this.infoView.$el.scrollTop(topOffset);

      // Brute force for mobile
      $(document).scrollTop(topOffset);
    }
  };


  // Toggle on-off node focus
  // --------
  //

  this.toggleNode = function(context, nodeId) {
    var state = this.readerCtrl.state;

    if (state.node === nodeId && state.context === context) {
      // Toggle off -> reset, preserve the context
      this.readerCtrl.modifyState({
        context: this.readerCtrl.currentContext,
        node: null,
        resource: null
      });
    } else {
      this.readerCtrl.modifyState({
        context: context,
        node: nodeId,
        resource: null
      });
    }
  };

  // Get scroll position of active panel
  // --------
  // 
  // Content, Figures, Citations, Info

  this.getScroll = function() {
    // Only covers the mobile mode!
    return $(document).scrollTop();
  };

  // Recover scroll from previous state (if there is any)
  // --------
  // 
  // TODO: retrieve from cookie to persist scroll pos over reload?

  this.recoverScroll = function() {
    var targetScroll = this.bodyScroll[this.readerCtrl.state.context];

    if (targetScroll) {
      $(document).scrollTop(targetScroll);
    } else {
      // Scroll to top
      // $(document).scrollTop(0);
    }
  };

  // Save current scroll position
  // --------
  // 

  this.saveScroll = function() {
    this.bodyScroll[this.readerCtrl.state.context] = this.getScroll();
  };

  // Explicit context switch
  // --------
  //
  // Only triggered by the explicit switch
  // Implicit context switches happen someone clicks a figure reference

  this.switchContext = function(context) {
    // var currentContext = this.readerCtrl.state.context;
    this.saveScroll();

    // Which view actions are triggered here?
    this.readerCtrl.switchContext(context);
    this.recoverScroll();
  };

  // Update Reader State
  // --------
  // 
  // Called every time the controller state has been modified
  // Search for readerCtrl.modifyState occurences

  this.updateState = function(options) {
    options = options || {};
    var state = this.readerCtrl.state;
    var that = this;

    // Set context on the reader view
    // -------

    this.$el.removeClass('toc figures citations info definitions');
    this.contentView.$('.content-node.active').removeClass('active');
    this.$el.addClass(state.context);
  
    if (state.node) {
      this.contentView.$('#'+state.node).addClass('active');
    }

    // According to the current context show active resource panel
    // -------

    this.updateResource();
  };


  // Based on the current application state, highlight the current resource
  // -------
  // 
  // Triggered by updateState

  this.updateResource = function() {
    var state = this.readerCtrl.state;
    this.$('.resources .content-node.active').removeClass('active fullscreen');
    this.contentView.$('.annotation.active').removeClass('active');
    
    if (state.resource) {
      // Show selected resource
      var $res = this.$('#'+state.resource);
      $res.addClass('active');
      if (state.fullscreen) $res.addClass('fullscreen');

      // Mark all annotations that reference the resource
      var annotations = this.resources.get(state.resource);
      _.each(annotations, function(a) {
        this.contentView.$('#'+a.id).addClass('active');
      }, this);

      // Update outline
    } else {
      this.recoverScroll();
      // Hide all resources (see above)
    }

    this.updateOutline();
  };

  // Returns true when on a mobile device
  // --------

  this.isMobile = function() {

  };

  // Whenever the app state changes
  // --------
  // 
  // Triggered by updateResource.

  this.updateOutline = function() {
    var that = this;
    var state = this.readerCtrl.state;
    var container = this.readerCtrl.content.container;

    var nodes = this.getResourceReferenceContainers();

    that.outline.update({
      context: state.context,
      selectedNode: state.node,
      highlightedNodes: nodes
    });


    // Resources outline
    // -------------------

    if (state.context === "toc") {
      // that.resourcesOutline.surface = this.tocView;
      $(that.resourcesOutline.el).addClass('hidden');
      return;
    } else if (state.context === "figures") {
      that.resourcesOutline.surface = this.figuresView;
    } else if (state.context === "citations") {
      that.resourcesOutline.surface = this.citationsView;
    } else if (state.context === "definitions") {
      that.resourcesOutline.surface = this.definitionsView;
    } else {
      that.resourcesOutline.surface = this.infoView;
    }

    $(that.resourcesOutline.el).removeClass('hidden');

    that.resourcesOutline.update({
      context: state.context,
      selectedNode: state.node,
      highlightedNodes: [state.resource]
    });
  };

  this.getResourceReferenceContainers = function() {
    var state = this.readerCtrl.state;

    if (!state.resource) return [];

    // A reference is an annotation node. We want to highlight
    // all (top-level) nodes that contain a reference to the currently activated resource
    // For that we take all references pointing to the resource
    // and find the root of the node on which the annotation sticks on.
    var references = this.resources.get(state.resource);
    var container = this.readerCtrl.content.container;
    var nodes = _.uniq(_.map(references, function(ref) {
      var nodeId = container.getRoot(ref.path[0]);
      return nodeId;
    }));
    return nodes;
  };

  // Annotate current selection
  // --------
  //

  this.annotate = function(type) {
    this.readerCtrl.content.annotate(type);
    return false;
  };

  // Rendering
  // --------
  //

  this.render = function() {
    var that = this;

    var state = this.readerCtrl.state;
    this.el.appendChild(new Renderer(this));

    // After rendering make reader reflect the app state
    this.$('.document').append(that.outline.el);

    this.$('.resources').append(that.resourcesOutline.el);

    // Await next UI tick to update layout and outline
    _.delay(function() {
      // Render outline that sticks on this.surface
      that.updateState();
      MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    }, 1);

    // Wait for stuff to be rendered (e.g. formulas)
    // TODO: use a handler? MathJax.Hub.Queue(fn) does not work for some reason

    _.delay(function() {
      that.updateOutline();
    }, 2000);

    var lazyOutline = _.debounce(function() {
      that.updateOutline();
    }, 1);

    // Jump marks for teh win
    if (state.node) {
      _.delay(function() {
        that.jumpToNode(state.node);
        if (state.resource) {
          that.jumpToResource(state.resource);
        }
      }, 100);
    }

    $(window).resize(lazyOutline);
    
    return this;
  };


  // Free the memory.
  // --------
  //

  this.dispose = function() {
    this.contentView.dispose();
    if (this.figuresView) this.figuresView.dispose();
    if (this.citationsView) this.citationsView.dispose();
    if (this.infoView) this.infoView.dispose();
    this.resources.dispose();

    this.stopListening();
  };
};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;

},{"lens-outline":55,"substance-application":57,"substance-data":63,"substance-surface":130,"substance-toc":132,"substance-util":134,"underscore":139}],128:[function(require,module,exports){
"use strict";

module.exports = require("./src/regexp");

},{"./src/regexp":129}],129:[function(require,module,exports){
"use strict";

// Substanc.RegExp.Match
// ================
//
// Regular expressions in Javascript they way they should be.

var Match = function(match) {
  this.index = match.index;
  this.match = [];

  for (var i=0; i < match.length; i++) {
    this.match.push(match[i]);
  }
};

Match.Prototype = function() {

  // Returns the capture groups
  // --------
  //

  this.captures = function() {
    return this.match.slice(1);
  };

  // Serialize to string
  // --------
  //

  this.toString = function() {
    return this.match[0];
  };
};

Match.prototype = new Match.Prototype();

// Substance.RegExp
// ================
//

var RegExp = function(exp) {
  this.exp = exp;
};

RegExp.Prototype = function() {

  this.match = function(str) {
    if (str === undefined) throw new Error('No string given');
    
    if (!this.exp.global) {
      return this.exp.exec(str);
    } else {
      var matches = [];
      var match;
      // Reset the state of the expression
      this.exp.compile(this.exp);

      // Execute until last match has been found

      while ((match = this.exp.exec(str)) !== null) {
        matches.push(new Match(match));
      }
      return matches;
    }
  };
};

RegExp.prototype = new RegExp.Prototype();

RegExp.Match = Match;


// Export
// ========

module.exports = RegExp;

},{}],130:[function(require,module,exports){
"use strict";

var Surface = require("./src/surface");

module.exports = Surface;

},{"./src/surface":131}],131:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var util = require("substance-util");
var Commander = require("substance-commander");

// Substance.Surface
// ==========================================================================

var Surface = function(doc, options) {

  options = _.extend({
    editable: true
  }, options);

  View.call(this);
  var that = this;

  this.options = options;

  if (this.options.renderer) {
    this.renderer = this.options.renderer;
  } else {
    this.renderer = new doc.__document.constructor.Renderer(doc);
  }

  // Incoming events
  this.doc = doc;

  // Pull out the registered nodetypes on the written article
  this.nodeTypes = doc.__document.nodeTypes;

  this.listenTo(this.doc.selection,  "selection:changed", this.renderSelection);
  this.listenTo(this.doc.__document, "property:updated", this.onUpdateView);
  this.listenTo(this.doc.__document, "graph:reset", this.reset);

  // Start building the initial stuff
  this.build();

  this.$el.addClass('surface');

  // Shouldn't this be done outside?
  this.$el.addClass(this.doc.view);

  // The editable surface responds to selection changes

  if (options.editable) {

    this.el.setAttribute("contenteditable", "true");
    this.el.spellcheck = false;

    this.$el.mouseup(function(e) {
      this.ignoreNextSelection = true;
      this.updateSelection(e);
    }.bind(this));

    this.$el.delegate('img', 'click', function(e) {
      var $el = $(e.currentTarget).parent().parent().parent();
      var nodeId = $el.attr('id');
      that.doc.selection.selectNode(nodeId);
      return false;
    });

    this._dirt = [];

    this._onKeyDown = function() {
      this._dirtPossible = true;
    }.bind(this);

    this._onTextInput = function(e) {
      //console.log("textinput", e);
      this._dirtPossible = false;
      while (this._dirt.length > 0) {
        var dirt = this._dirt.shift();
        dirt[0].textContent = dirt[1];
      }
      this.doc.write(e.data);
      e.preventDefault();
    }.bind(this);

    var _manipulate = function(f, dontPrevent) {
      return function(e) {
        that._dirtPossible = false;
        setTimeout(f, 0);
        if (dontPrevent !== true) {
          e.preventDefault();
        }
      };
    };

    // TODO: many combinations which would probably be easy to handle
    // using the native event...
    this.keyboard = new Commander.Mousetrap();
    this.keyboard.bind([
        "up", "down", "left", "right",
        "shift+up", "shift+down", "shift+left", "shift+right",
        "ctrl+up", "ctrl+down", "ctrl+left", "ctrl+right",
        "ctrl+shift+up", "ctrl+shift+down", "ctrl+shift+left", "ctrl+shift+right",
        "alt+up", "alt+down", "alt+left", "alt+right"
      ], function() {
      // call this after the movement has been done by the contenteditable
      setTimeout(function() {
        that.ignoreNextSelection = true;
        that.updateSelection();
      }, 0);
    }, "keydown");

    this.keyboard.bind(["backspace"], _manipulate(function() {
      that.doc.delete("left");
    }), "keydown");

    this.keyboard.bind(["del"], _manipulate(function() {
      that.doc.delete("right");
    }), "keydown");

    this.keyboard.bind(["enter"], _manipulate(function() {
      that.doc.modifyNode();
    }), "keydown");

    this.keyboard.bind(["shift+enter"], _manipulate(function() {
      that.doc.write("\n");
    }), "keydown");

    this.keyboard.bind(["space"], _manipulate(function() {
      that.doc.write(" ");
    }), "keydown");

    this.keyboard.bind(["tab"], _manipulate(function() {
      that.doc.write("  ");
    }), "keydown");

    this.keyboard.bind(["ctrl+z"], _manipulate(function() {
      that.doc.undo();
    }), "keydown");

    this.keyboard.bind(["ctrl+shift+z"], _manipulate(function() {
      that.doc.redo();
    }), "keydown");

    this.makeEditable(this.el);
  }
};


Surface.Prototype = function() {

  // Private helpers
  // ---------------
  var _findNodeElement = function(node) {
    var current = node;
    while(current !== undefined) {
      if ($(current).is(".content-node")) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  };

  this.makeEditable = function(el) {
    var that = this;

    el.addEventListener("keydown", this._onKeyDown);

    // TODO: cleanup... Firefix needs a different event...
    el.addEventListener("textInput", this._onTextInput, true);
    el.addEventListener("input", this._onTextInput, true);

    this._dirt = [];
    this._observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (that._dirtPossible) {
          that._dirt.push([mutation.target, mutation.oldValue]);
        }
      });
    });
    // configuration of the observer:
    var config = { subtree: true, characterData: true, characterDataOldValue: true };
    this._observer.observe(el, config);

    this.keyboard.connect(el);
  };

  // Read out current DOM selection and update selection in the model
  // ---------------

  this.updateSelection = function(/*e*/) {
    // console.log("Surface.updateSelection()");
    var wSel = window.getSelection();

    // HACK: sometimes it happens that the selection anchor node is undefined.
    // Try to understand and fix someday.
    if (wSel.anchorNode === null) {
      return;
    }

    // Set selection to the cursor if clicked on the cursor.
    if ($(wSel.anchorNode.parentElement).is(".cursor")) {
      this.doc.selection.collapse("cursor");
      return;
    }

    var wRange = wSel.getRangeAt(0);
    var wStartPos;
    var wEndPos;

    // Preparing information for EOL-HACK (see below).
    // The hack only needs to be applied of the mouse event is in a different 'line'
    // than the DOM Range provided by the browser
    //Surface.Hacks.prepareEndOfLineHack.call(this, e, wRange);

    // Note: there are three different cases:
    // 1. selection started at startContainer (regular)
    // 2. selection started at endContainer (reverse)
    // 3. selection done via double click (anchor in different to range boundaries)
    // In cases 1. + 3. the range is used as given, in case 2. reversed.

    wStartPos = [wRange.startContainer, wRange.startOffset];
    wEndPos = [wRange.endContainer, wRange.endOffset];

    if (wRange.endContainer === wSel.anchorNode && wRange.endOffset === wSel.anchorOffset) {
      var tmp = wStartPos;
      wStartPos = wEndPos;
      wEndPos = tmp;
    }

    var startNode = _findNodeElement.call(this, wStartPos[0]);
    var endNode = _findNodeElement.call(this, wEndPos[0]);

    var startNodeId = startNode.getAttribute("id");
    var startNodePos = this.doc.getPosition(startNodeId) ;
    var startCharPos = this.nodes[startNodeId].getCharPosition(wStartPos[0], wStartPos[1]);

    var endNodeId = endNode.getAttribute("id");
    var endNodePos = this.doc.getPosition(endNodeId);
    var endCharPos = this.nodes[endNodeId].getCharPosition(wEndPos[0], wEndPos[1]);

    // the selection range in Document.Selection coordinates
    var startPos = [startNodePos, startCharPos];
    var endPos = [endNodePos, endCharPos];

    this.doc.selection.set({start: startPos, end: endPos});
  };


  // Renders the current selection
  // --------
  //

  this.renderSelection = function() {

    if (this.ignoreNextSelection === true) {
      this.ignoreNextSelection = false;
      return;
    }

    if (this.doc.selection.isNull()) {
      this.$cursor.hide();
      return;
    }

    // Hide native selection in favor of our custom one
    var wSel = window.getSelection();

    var range = this.doc.selection.range();
    var startNode = this.doc.getNodeFromPosition(range.start[0]);
    var startNodeView = this.renderer.nodes[startNode.id];
    var wStartPos = startNodeView.getDOMPosition(range.start[1]);

    var endNode = this.doc.getNodeFromPosition(range.end[0]);
    var endNodeView = this.renderer.nodes[endNode.id];
    var wEndPos = endNodeView.getDOMPosition(range.end[1]);

    var wRange = document.createRange();
    wRange.setStart(wStartPos.startContainer, wStartPos.startOffset);
    wRange.setEnd(wEndPos.endContainer, wEndPos.endOffset);
    wSel.removeAllRanges();
    wSel.addRange(wRange);

  };

  // Setup
  // --------
  //

  this.build = function() {
    // var Renderer = this.options.renderer || this.doc.__document.constructor.Renderer;
    // var renderer = this.options.renderer:
    // Create a Renderer instance, which implicitly constructs all content node views.
    // this.renderer = new Renderer(this.doc);

    // Add some backward compatibility
    this.nodes = this.renderer.nodes;
  };

  // Render it
  // --------
  //
  // input.image-files
  // .controls
  // .nodes
  //   .content-node.paragraph
  //   .content-node.heading
  //   ...
  // .cursor

  this.render = function() {

    var fileInput = document.createElement('input');
    fileInput.className = "image-files";
    fileInput.setAttribute("type", "file");

    fileInput.setAttribute("name", "files[]");

    var controls = document.createElement('div');
    controls.className = "controls";
    var nodes = document.createElement('div');
    nodes.className = "nodes";

    var cursor = document.createElement('div');
    cursor.className = "cursor";

    this.el.appendChild(fileInput);
    this.el.appendChild(controls);
    this.el.appendChild(nodes);
    this.el.appendChild(cursor);

    // console.log("Surface.render()", "this.doc.getNodes()", nodes);

    // Actual content goes here
    // --------
    //
    // We get back a document fragment from the renderer

    nodes.appendChild(this.renderer.render());

    // TODO: fixme
    this.$('input.image-files').hide();
    this.$cursor = this.$('.cursor');
    this.$cursor.hide();

    // keep the nodes for later access
    this._nodesEl = nodes;

    return this;
  };

  this.reset = function() {
    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });
    this.build();
    this.render();
  };

  // Cleanup view before removing it
  // --------
  //

  this.dispose = function() {
    this.stopListening();
    _.each(this.nodes, function(n) {
      n.dispose();
    }, this);
  };

  // TODO: we could factor this out into something like a ContainerView?

  function insertOrAppend(container, pos, el) {
    var childs = container.childNodes;
    if (pos < childs.length) {
      var refNode = childs[pos];
      container.insertBefore(el, refNode);
    } else {
      container.appendChild(el);
    }
  }

  this.onUpdateView = function(path, diff) {
    if (path.length !== 2 || path[0] !== "content" || path[1] !== "nodes") return;

    var nodeId, node;
    var container = this._nodesEl;

    var children, el;

    if (diff.isInsert()) {
      // Create a view and insert render it into the nodes container element.
      nodeId = diff.val;
      node = this.doc.get(nodeId);
      // TODO: this will hopefully be solved in a clean way
      // when we have done the 'renderer' refactorings
      if (this.nodeTypes[node.type]) {
        var nodeView = this.renderer.createView(node);
        this.nodes[nodeId] = nodeView;
        el = nodeView.render().el;
        insertOrAppend(container, diff.pos, el);
      }
    }
    else if (diff.isDelete()) {
      // Dispose the view and remove its element from the nodes container
      nodeId = diff.val;
      if (this.nodes[nodeId]) {
        this.nodes[nodeId].dispose();
      }
      delete this.nodes[nodeId];
      children = container.children;
      container.removeChild(children[diff.pos]);
    }
    else if (diff.isMove()) {
      children = container.children;
      el = children[diff.pos];
      container.removeChild(el);
      insertOrAppend(container, diff.target, el);
    } else if (diff.type === "NOP") {
    } else {
      throw new Error("Illegal state.");
    }
  };
};

_.extend(Surface.Prototype, util.Events.Listener);

Surface.Prototype.prototype = View.prototype;
Surface.prototype = new Surface.Prototype();

module.exports = Surface;

},{"substance-application":57,"substance-commander":143,"substance-util":134,"underscore":139}],132:[function(require,module,exports){
"use strict";

var TOC = require("./toc_view");

module.exports = TOC;
},{"./toc_view":133}],133:[function(require,module,exports){
"use strict";

var View = require("substance-application").View;
var $$ = require("substance-application").$$;
var Data = require("substance-data");
var Index = Data.Graph.Index;
var _ = require("underscore");

// Substance.TOC.View
// ==========================================================================

var TOCView = function(doc) {
  View.call(this);
  this.doc = doc;

  // Sniff into headings
  // --------
  // 

  this.headings = _.filter(this.doc.content.getNodes(), function(node) {
    return node.type === "heading";
  });

  this.$el.addClass("toc");
};

TOCView.Prototype = function() {

  // Renderer
  // --------

  this.render = function() {
    if (this.headings.length <= 2) return this;
    _.each(this.headings, function(heading) {
      this.el.appendChild($$('a.heading-ref.level-'+heading.level, {
        id: "toc_"+heading.id,
        text: heading.content,
        "sbs-click": "jumpToNode("+heading.id+")"
      }));
    }, this);

    return this;
  };

  // Renderer
  // --------
  // 

  this.setActiveNode = function(nodeId) {
    this.$('.heading-ref.active').removeClass('active');
    this.$('#toc_'+nodeId).addClass('active');
  };

};

TOCView.Prototype.prototype = View.prototype;
TOCView.prototype = new TOCView.Prototype();

module.exports = TOCView;

},{"substance-application":57,"substance-data":63,"underscore":139}],134:[function(require,module,exports){
"use strict";

var util = require("./src/util");

util.errors = require("./src/errors");
util.html = require("./src/html");
util.dom = require("./src/dom");

module.exports = util;

},{"./src/dom":135,"./src/errors":136,"./src/html":137,"./src/util":138}],135:[function(require,module,exports){
"use strict";

var _ = require("underscore");

// Helpers for working with the DOM

var dom = {};

dom.ChildNodeIterator = function(arg) {
  if(_.isArray(arg)) {
    this.nodes = arg;
  } else {
    this.nodes = arg.childNodes;
  }
  this.length = this.nodes.length;
  this.pos = -1;
};

dom.ChildNodeIterator.prototype = {
  hasNext: function() {
    return this.pos < this.length - 1;
  },

  next: function() {
    this.pos += 1;
    return this.nodes[this.pos];
  },

  back: function() {
    if (this.pos >= 0) {
      this.pos -= 1;
    }
    return this;
  }
};

// Note: it is not safe regarding browser in-compatibilities
// to access el.children directly.
dom.getChildren = function(el) {
  if (el.children !== undefined) return el.children;
  var children = [];
  var child = el.firstElementChild;
  while (child) {
    children.push(child);
    child = child.nextElementSibling;
  }
  return children;
};

dom.getNodeType = function(el) {
  if (el.nodeType === Node.TEXT_NODE) {
    return "text";
  } else if (el.nodeType === Node.COMMENT_NODE) {
    return "comment";
  } else if (el.tagName) {
    return el.tagName.toLowerCase();
  } else {
    throw new Error("Unknown node type");
  }
};

module.exports = dom;

},{"underscore":139}],136:[function(require,module,exports){
"use strict";

// Imports
// ====

var _ = require('underscore');
var util = require('./util');

// Module
// ====

var errors = {};

errors.SubstanceError = function(name, code, message) {
  if (arguments.length == 1) {
    message = name;
    name = "SubstanceError";
    code = -1;
  }

  this.message = message;
  this.name = name;
  this.code = code;

  this.__stack = util.callstack(1);
};

errors.SubstanceError.Prototype = function() {

  this.toString = function() {
    return this.name+":"+this.message;
  };

  this.toJSON = function() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack
    };
  };

  this.printStackTrace = function() {
    util.printStackTrace(this);
  };

};
errors.SubstanceError.prototype = new errors.SubstanceError.Prototype();

Object.defineProperty(errors.SubstanceError.prototype, "stack", {
  get: function() {
    var str = [];
    for (var idx = 0; idx < this.__stack.length; idx++) {
      var s = this.__stack[idx];
      str.push(s.file+":"+s.line+":"+s.col+" ("+s.func+")");
    }
    return str.join("\n");
  },
  set: function() { throw new Error("immutable.")}
});

errors.define = function(className, code) {
  if (code === undefined) code = -1;
  errors[className] = errors.SubstanceError.bind(null, className, code);
  errors[className].prototype = errors.SubstanceError.prototype;
  return errors[className];
};

module.exports = errors;

},{"./util":138,"underscore":139}],137:[function(require,module,exports){
"use strict";

var html = {};
var _ = require("underscore");

html.templates = {};

// html.compileTemplate = function(tplName) {
//   var rawTemplate = $('script[name='+tplName+']').html();
//   html.templates[tplName] = Handlebars.compile(rawTemplate);
// };

html.renderTemplate = function(tplName, data) {
  return html.templates[tplName](data);
};

// Handlebars.registerHelper('ifelse', function(cond, textIf, textElse) {
//   textIf = Handlebars.Utils.escapeExpression(textIf);
//   textElse  = Handlebars.Utils.escapeExpression(textElse);
//   return new Handlebars.SafeString(cond ? textIf : textElse);
// });

if (typeof window !== "undefined") {
  // A fake console to calm down some browsers.
  if (!window.console) {
    window.console = {
      log: function(msg) {
        // No-op
      }
    };
  }
}

// Render Underscore templates
html.tpl = function (tpl, ctx) {
  ctx = ctx || {};
  var source = $('script[name='+tpl+']').html();
  return _.template(source, ctx);
};

// Exports
// ====

module.exports = html;

},{"underscore":139}],138:[function(require,module,exports){
"use strict";

// Imports
// ====

var _ = require('underscore');

// Module
// ====

var util = {};

// UUID Generator
// -----------------

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

util.uuid = function (prefix, len) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
      uuid = [],
      radix = 16,
      idx;
  len = len || 32;

  if (len) {
    // Compact form
    for (idx = 0; idx < len; idx++) uuid[idx] = chars[0 | Math.random()*radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (idx = 0; idx < 36; idx++) {
      if (!uuid[idx]) {
        r = 0 | Math.random()*16;
        uuid[idx] = chars[(idx == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return (prefix ? prefix : "") + uuid.join('');
};

// creates a uuid function that generates counting uuids
util.uuidGen = function(defaultPrefix) {
  var id = 1;
  defaultPrefix = (defaultPrefix !== undefined) ? defaultPrefix : "uuid_";
  return function(prefix) {
    prefix = prefix || defaultPrefix;
    return prefix+(id++);
  };
};


// Events
// ---------------

// Taken from Backbone.js
//
// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, util.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function(events, args) {
  var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
  switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
  }
};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
var eventsApi = function(obj, action, name, rest) {
  if (!name) return true;

  // Handle event maps.
  if (typeof name === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
    return false;
  }

  // Handle space separated event names.
  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, l = names.length; i < l; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
    return false;
  }

  return true;
};

util.Events = {

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events =  this._events || {};
    var events = this._events[name] || (this._events[name] = []);
    events.push({callback: callback, context: context, ctx: context || this});
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _.once(function() {
      self.off(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function(name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
    if (!name && !callback && !context) {
      this._events = {};
      return this;
    }

    names = name ? [name] : _.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      events = this._events[name];
      if (events) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) delete this._events[name];
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(name) {
    if (!this._events) return this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, arguments);
    return this;
  },

  triggerLater: function() {
    var self = this;
    var _arguments = arguments;
    setTimeout(function() {
      self.trigger.apply(self, _arguments);
    }, 0);
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function(obj, name, callback) {
    var listeners = this._listeners;
    if (!listeners) return this;
    var deleteListener = !name && !callback;
    if (typeof name === 'object') callback = this;
    if (obj) (listeners = {})[obj._listenerId] = obj;
    for (var id in listeners) {
      listeners[id].off(name, callback, this);
      if (deleteListener) delete this._listeners[id];
    }
    return this;
  }

};

var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

// Inversion-of-control versions of `on` and `once`. Tell *this* object to
// listen to an event in another object ... keeping track of what it's
// listening to.
_.each(listenMethods, function(implementation, method) {
  util.Events[method] = function(obj, name, callback) {
    var listeners = this._listeners || (this._listeners = {});
    var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
    listeners[id] = obj;
    if (typeof name === 'object') callback = this;
    obj[implementation](name, callback, this);
    return this;
  };
});

// Aliases for backwards compatibility.
util.Events.bind   = util.Events.on;
util.Events.unbind = util.Events.off;

util.Events.Listener = {

  listenTo: function(obj, name, callback) {
    if (!_.isFunction(callback)) {
      throw new Error("Illegal argument: expecting function as callback, was: " + callback);
    }

    // initialize container for keeping handlers to unbind later
    this._handlers = this._handlers || [];

    obj.on(name, callback, this);

    this._handlers.push({
      unbind: function() {
        obj.off(name, callback);
      }
    });

    return this;
  },

  stopListening: function() {
    if (this._handlers) {
      for (var i = 0; i < this._handlers.length; i++) {
        this._handlers[i].unbind();
      }      
    }
  }

};


var __once__ = _.once;

function callAsynchronousChain(options, cb) {
  var _finally = options.finally || function(err, data) { cb(err, data); };
  _finally = __once__(_finally);
  var data = options.data || {};
  var functions = options.functions;

  if (!_.isFunction(cb)) {
    return cb("Illegal arguments: a callback function must be provided");
  }

  var index = 0;
  var stopOnError = (options.stopOnError===undefined) ? true : options.stopOnError;
  var errors = [];

  function process(data) {
    var func = functions[index];

    // stop if no function is left
    if (!func) {
      if (errors.length > 0) {
        return _finally(new Error("Multiple errors occurred.", data));
      } else {
        return _finally(null, data);
      }
    }

    // A function that is used as call back for each function
    // which does the progression in the chain via recursion.
    // On errors the given callback will be called and recursion is stopped.
    var recursiveCallback = __once__(function(err, data) {
      // stop on error
      if (err) {
        if (stopOnError) {
          return _finally(err, null);
        } else {
          errors.push(err);
        }
      }

      index += 1;
      process(data);
    });

    // catch exceptions and propagat
    try {
      if (func.length === 1) {
        func(recursiveCallback);
      } else {
        func(data, recursiveCallback);
      }
    } catch (err) {
      console.log("util.async caught error:", err);
      util.printStackTrace(err);
      _finally(err);
    }
  }

  // start processing
  process(data);
}

// Async Control Flow for the Substance
// --------

// TODO: use util.async.sequential instead
util.async = {};

// Calls a given list of asynchronous functions sequentially
// -------------------
// options:
//    functions:  an array of functions of the form f(data,cb)
//    data:       data provided to the first function; optional
//    finally:    a function that will always be called at the end, also on errors; optional

util.async.sequential = function(options, cb) {
  // allow to call this with an array of functions instead of options
  if(_.isArray(options)) {
    options = { functions: options };
  }
  callAsynchronousChain(options, cb);
};

function asynchronousIterator(options) {
  return function(data, cb) {
    // retrieve items via selector if a selector function is given
    var items = options.selector ? options.selector(data) : options.items;
    var _finally = options.finally || function(err, data) { cb(err, data); };

    // don't do nothing if no items are given
    if (!items) return _finally(null, data);

    var isArray = _.isArray(items);

    if (options.before) {
      options.before(data);
    }

    var funcs = [];
    var iterator = options.iterator;

    // TODO: discuss convention for iterator function signatures.
    // trying to achieve a combination of underscore and node.js callback style
    function arrayFunction(item, index) {
      return function(data, cb) {
        if (iterator.length === 2) {
          iterator(item, cb);
        } else if (iterator.length === 3) {
          iterator(item, index, cb);
        } else {
          iterator(item, index, data, cb);
        }
      };
    }

    function objectFunction(value, key) {
      return function(data, cb) {
        if (iterator.length === 2) {
          iterator(value, cb);
        } else if (iterator.length === 3) {
          iterator(value, key, cb);
        } else {
          iterator(value, key, data, cb);
        }
      };
    }

    if (isArray) {
      for (var idx = 0; idx < items.length; idx++) {
        funcs.push(arrayFunction(items[idx], idx));
      }
    } else {
      for (var key in items) {
        funcs.push(objectFunction(items[key], key));
      }
    }

    //console.log("Iterator:", iterator, "Funcs:", funcs);
    var chainOptions = {
      functions: funcs,
      data: data,
      finally: _finally,
      stopOnError: options.stopOnError
    };
    callAsynchronousChain(chainOptions, cb);
  };
}

// Creates an each-iterator for util.async chains
// -----------
//
//     var func = util.async.each(items, function(item, [idx, [data,]] cb) { ... });
//     var func = util.async.each(options)
//
// options:
//    items:    the items to be iterated
//    selector: used to select items dynamically from the data provided by the previous function in the chain
//    before:   an extra function called before iteration
//    iterator: the iterator function (item, [idx, [data,]] cb)
//       with item: the iterated item,
//            data: the propagated data (optional)
//            cb:   the callback

// TODO: support only one version and add another function
util.async.iterator = function(options_or_items, iterator) {
  var options;
  if (arguments.length == 1) {
    options = options_or_items;
  } else {
    options = {
      items: options_or_items,
      iterator: iterator
    };
  }
  return asynchronousIterator(options);
};

util.async.each = function(options, cb) {
  // create the iterator and call instantly
  var f = asynchronousIterator(options);
  f(null, cb);
};

util.propagate = function(data, cb) {
  if(!_.isFunction(cb)) {
    throw "Illegal argument: provided callback is not a function";
  }
  return function(err) {
    if (err) return cb(err);
    cb(null, data);
  };
};

// shamelessly stolen from backbone.js:
// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var ctor = function(){};
util.inherits = function(parent, protoProps, staticProps) {
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ parent.apply(this, arguments); };
  }

  // Inherit class (static) properties from parent.
  _.extend(child, parent);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) _.extend(child.prototype, protoProps);

  // Add static properties to the constructor function, if supplied.
  if (staticProps) _.extend(child, staticProps);

  // Correctly set child's `prototype.constructor`.
  child.prototype.constructor = child;

  // Set a convenience property in case the parent's prototype is needed later.
  child.__super__ = parent.prototype;

  return child;
};

// Util to read seed data from file system
// ----------

util.getJSON = function(resource, cb) {
  if (typeof exports !== 'undefined') {
    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync(resource, 'utf8'));
    cb(null, obj);
  } else {
    //console.log("util.getJSON", resource);
    $.getJSON(resource)
      .done(function(obj) { cb(null, obj); })
      .error(function(err) { cb(err, null); });
  }
};

util.prototype = function(that) {
  /*jshint proto: true*/ // supressing a warning about using deprecated __proto__.
  return Object.getPrototypeOf ? Object.getPrototypeOf(that) : that.__proto__;
};

util.inherit = function(Super, Self) {
  var super_proto = _.isFunction(Super) ? new Super() : Super;
  var proto;
  if (_.isFunction(Self)) {
    Self.prototype = super_proto;
    proto = new Self();
  } else {
    var TmpClass = function(){};
    TmpClass.prototype = super_proto;
    proto = _.extend(new TmpClass(), Self);
  }
  return proto;
};

util.pimpl = function(pimpl) {
  var Pimpl = function(self) {
    this.self = self;
  };
  Pimpl.prototype = pimpl;
  return function(self) { self = self || this; return new Pimpl(self); };
};

util.parseStackTrace = function(err) {
  var SAFARI_STACK_ELEM = /([^@]*)@(.*):(\d+)/;
  var CHROME_STACK_ELEM = /\s*at ([^(]*)[(](.*):(\d+):(\d+)[)]/;

  var idx;
  var stackTrace = err.stack.split('\n');

  // parse the stack trace: each line is a tuple (function, file, lineNumber)
  // Note: unfortunately this is interpreter specific
  // safari: "<function>@<file>:<lineNumber>"
  // chrome: "at <function>(<file>:<line>:<col>"

  var stack = [];
  for (idx = 0; idx < stackTrace.length; idx++) {
    var match = SAFARI_STACK_ELEM.exec(stackTrace[idx]);
    if (!match) match = CHROME_STACK_ELEM.exec(stackTrace[idx]);
    if (match) {
      var entry = {
        func: match[1],
        file: match[2],
        line: match[3],
        col: match[4] || 0
      };
      if (entry.func === "") entry.func = "<anonymous>";
      stack.push(entry);
    }
  }

  return stack;
};

util.callstack = function(k) {
  var err;
  try { throw new Error(); } catch (_err) { err = _err; }
  var stack = util.parseStackTrace(err);
  k = k || 0;
  return stack.splice(k+1);
};

util.stacktrace = function (err) {
  var stack = (arguments.length === 0) ? util.callstack().splice(1) : util.parseStackTrace(err);
  var str = [];
  _.each(stack, function(s) {
    str.push(s.file+":"+s.line+":"+s.col+" ("+s.func+")");
  });
  return str.join("\n");
};

util.printStackTrace = function(err, N) {
  if (!err.stack) return;

  var stack;

  // Substance errors have a nice stack already
  if (err.__stack !== undefined) {
    stack = err.__stack;
  }
  // built-in errors have the stack trace as one string
  else if (_.isString(err.stack)) {
    stack = util.parseStackTrace(err);
  }
  else return;

  N = N || stack.length;
  N = Math.min(N, stack.length);

  for (var idx = 0; idx < N; idx++) {
    var s = stack[idx];
    console.log(s.file+":"+s.line+":"+s.col, "("+s.func+")");
  }
};

// computes the difference of obj1 to obj2
util.diff = function(obj1, obj2) {
  var diff;
  if (_.isArray(obj1) && _.isArray(obj2)) {
    diff = _.difference(obj2, obj1);
    // return null in case of equality
    if (diff.length === 0) return null;
    else return diff;
  }
  if (_.isObject(obj1) && _.isObject(obj2)) {
    diff = {};
    _.each(Object.keys(obj2), function(key) {
      var d = util.diff(obj1[key], obj2[key]);
      if (d) diff[key] = d;
    });
    // return null in case of equality
    if (_.isEmpty(diff)) return null;
    else return diff;
  }
  if(obj1 !== obj2) return obj2;
};

// Deep-Clone a given object
// --------
// Note: this is currently done via JSON.parse(JSON.stringify(obj))
//       which is in fact not optimal, as it depends on `toJSON` implementation.
util.deepclone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

// Clones a given object
// --------
// Calls obj's `clone` function if available,
// otherwise clones the obj using `util.deepclone()`.
util.clone = function(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (_.isFunction(obj.clone)) {
    return obj.clone();
  }
  return util.deepclone(obj);
};

util.freeze = function(obj) {
  var idx;
  if (_.isObject(obj)) {
    if (Object.isFrozen(obj)) return obj;

    var keys = Object.keys(obj);
    for (idx = 0; idx < keys.length; idx++) {
      var key = keys[idx];
      obj[key] = util.freeze(obj[key]);
    }
    return Object.freeze(obj);
  } else if (_.isArray(obj)) {
    var arr = obj;
    for (idx = 0; idx < arr.length; idx++) {
      arr[idx] = util.freeze(arr[idx]);
    }
    return Object.freeze(arr);
  } else {
    return obj; // Object.freeze(obj);
  }
};

util.later = function(f, context) {
  return function() {
    var _args = arguments;
    setTimeout(function() {
      f.apply(context, _args);
    }, 0);
  };
};


// Returns true if a string doesn't contain any real content

util.isEmpty = function(str) {
  return !str.match(/\w/);
};

// Export
// ====

module.exports = util;

},{"fs":143,"underscore":139}],139:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],140:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var Application = require("substance-application");
var LensController = require("./lens_controller");
var LensView = require("./lens_view");
var util = require("substance-util");
var html = util.html;

var ROUTES = [
  {
    "route": ":context/:node/:resource/:fullscreen",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node/:resource",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node/:resource",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node",
    "name": "document-node", 
    "command": "openReader"
  },
  {
    "route": ":context",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "url/:url",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "",
    "name": "document",
    "command": "openReader"
  }
];

// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || {};
  config.routes = ROUTES;
  Application.call(this, config);

  this.controller = new LensController(config);
};

Lens.Article = require("lens-article");
Lens.Reader = require("substance-reader");
Lens.Outline = require("lens-outline");


Lens.Prototype = function() {

  // Start listening to routes
  // --------

  this.render = function() {
    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);
  }
};


Lens.Prototype.prototype = Application.prototype;
Lens.prototype = new Lens.Prototype();
Lens.prototype.constructor = Lens;

var Substance = {
  util: require("substance-util"),
  Application: require("substance-application"),
  Document: require("substance-document"),
  Operator: require("substance-operator"),
  Chronicle: require("substance-chronicle"),
  Data: require("substance-data"),
  Surface: require("substance-surface")
};

Lens.Substance = Substance;
module.exports = Lens;

},{"./lens_controller":141,"./lens_view":142,"lens-article":3,"lens-outline":55,"substance-application":57,"substance-chronicle":143,"substance-data":63,"substance-document":68,"substance-operator":143,"substance-reader":125,"substance-surface":130,"substance-util":134,"underscore":139}],141:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Controller = require("substance-application").Controller;
var LensView = require("./lens_view");
var ReaderController = require("substance-reader").Controller;
var Article = require("lens-article");
var Converter = require("lens-converter");

// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(config) {
  Controller.call(this);

  this.config = config;

  // Main controls
  this.on('open:reader', this.openReader);
};

LensController.Prototype = function() {

  // Initial view creation
  // ===================================

  this.createView = function() {
    var view = new LensView(this);
    this.view = view;
    return view;
  };

  // After a file gets drag and dropped it will be remembered in Local Storage
  // ---------

  this.importXML = function(xml) {
    var importer = new Converter.Importer();
    var doc = importer.import(xml, {
      TRIM_WHITESPACES: true
    });
    this.createReader(doc, {
      context: 'toc'
    });
  };

  // Update URL Fragment
  // -------
  // 
  // This will be obsolete once we have a proper router vs app state 
  // integration.

  this.updatePath = function(state) {
    var path = [];

    path.push(state.context);

    if (state.node) {
      path.push(state.node);
    } else {
      path.push('all');
    }

    if (state.resource) {
      path.push(state.resource);
    }

    if (state.fullscreen) {
      path.push('fullscreen');
    }

    window.app.router.navigate(path.join('/'), {
      trigger: false,
      replace: false
    });
  };

  this.createReader = function(doc, state) {
    var that = this;

    // Create new reader controller instance
    this.reader = new ReaderController(doc, state);

    this.reader.on('state-changed', function() {
      that.updatePath(that.reader.state);
    });

    this.modifyState({
      context: 'reader'
    });
  };

  this.openReader = function(context, node, resource, fullscreen) {
    var that = this;

    // The article view state
    var state = {
      context: context || "toc",
      node: node,
      resource: resource,
      fullscreen: !!fullscreen
    };

    // Already loaded?
    if (this.reader) {
      this.reader.modifyState(state);
      // HACK: This shouldn't be monkeypatched
      if (state.resource) this.reader.view.jumpToResource(state.resource);
    } else if (this.config.document_url === "lens_article.xml") {
      var doc = Article.describe();
      that.createReader(doc, state);
    } else {
      this.trigger("loading:started", "Loading article");
      $.get(this.config.document_url)
      .done(function(data) {
        var doc, err;

        // Determine type of resource
        var xml = $.isXMLDoc(data);

        // Process XML file
        if (xml) {
          var importer = new Converter.Importer();
          doc = importer.import(data, {
            TRIM_WHITESPACES: true
          });
        } else {
          if(typeof data == 'string') data = $.parseJSON(data);
          doc = Article.fromSnapshot(data);
        }
        that.createReader(doc, state);
      })
      .fail(function(err) {
        that.view.startLoading("Error during loading. Please try again.")
        console.error(err);
      });
    }
  };

  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  //

  this.getActiveControllers = function() {
    var result = [["lens", this]];
    result.push(["reader", this.reader]);
    return result;
  };
};


// Exports
// --------

LensController.Prototype.prototype = Controller.prototype;
LensController.prototype = new LensController.Prototype();
_.extend(LensController.prototype, util.Events);

module.exports = LensController;

},{"./lens_view":142,"lens-article":3,"lens-converter":48,"substance-application":57,"substance-reader":125,"substance-util":134,"underscore":139}],142:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var $$ = require("substance-application").$$;


// Lens.View Constructor
// ========
// 

var LensView = function(controller) {
  View.call(this);

  this.controller = controller;
  this.$el.attr({id: "container"});

  // Handle state transitions
  // --------
  
  this.listenTo(this.controller, 'state-changed', this.onStateChanged);
  this.listenTo(this.controller, 'loading:started', this.startLoading);

  $(document).on('dragover', function () { return false; });
  $(document).on('ondragend', function () { return false; });
  $(document).on('drop', this.handleDroppedFile.bind(this));
};

LensView.Prototype = function() {


  this.handleDroppedFile = function(e) {
    var ctrl = this.controller;
    var files = event.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
      ctrl.importXML(e.target.result);
    };

    reader.readAsText(file);
    return false;
  };

  // Session Event handlers
  // --------
  //

  this.onStateChanged = function() {
    var state = this.controller.state;
    if (state.context === "reader") {
      this.openReader();
    } else {
      console.log("Unknown application state: " + state);
    }
  };

  this.startLoading = function(msg) {
    if (!msg) msg = "Loading article";
    $('.spinner-wrapper .message').html(msg);
    $('body').addClass('loading');
  };

  this.stopLoading = function() {
    $('body').removeClass('loading');
  };


  // Open the reader view
  // ----------
  //

  this.openReader = function() {
    var view = this.controller.reader.createView();
    var that = this;
    
    that.replaceMainView('reader', view);
    that.startLoading("Typesetting");

    this.$('#main').css({opacity: 0});
    
    _.delay(function() {
      that.stopLoading();
      that.$('#main').css({opacity: 1});
    }, 1000);
  };

  // Rendering
  // ==========================================================================
  //

  this.replaceMainView = function(name, view) {
    $('body').removeClass().addClass('current-view '+name);

    if (this.mainView && this.mainView !== view) {
      this.mainView.dispose();
    }

    this.mainView = view;
    this.$('#main').html(view.render().el);
  };

  this.render = function() {
    this.el.innerHTML = "";

    // Browser not supported dialogue
    // ------------

    this.el.appendChild($$('.browser-not-supported', {
      text: "Sorry, your browser is not supported.",
      style: "display: none;"
    }));

    // Spinner
    // ------------  

    this.el.appendChild($$('.spinner-wrapper', {
      children: [
        $$('.spinner'),
        $$('.message', {html: 'Loading article'})
      ]
    }));

    // Main container
    // ------------

    this.el.appendChild($$('#main'));
    return this;
  };

  this.dispose = function() {
    this.stopListening();
    if (this.mainView) this.mainView.dispose();
  };
};


// Export
// --------

LensView.Prototype.prototype = View.prototype;
LensView.prototype = new LensView.Prototype();

module.exports = LensView;
},{"substance-application":57,"underscore":139}],143:[function(require,module,exports){

},{}]},{},[1]);
