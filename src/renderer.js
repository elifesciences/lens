(function(root) {

// // Lens.NodeRenderer
// ========

function NodeRenderer(node, doc, scope, property) {
  this.node = node;
  this.doc = doc;
  this.scope = scope;
  this.property = property;
}

// Do the rendering of one node
// --------
// 
// Considers annotations linked to that node/property combination

NodeRenderer.prototype.render = function() {
  var content = this.doc;
  var doc = this.doc;
  var properties = content.properties;
  var scope = this.scope;

  function annotationsForNode(node) {
    var annotations = doc.find('annotations', node.id),
        result = [],
        mappings = {
      "starts": {},
      "ends": {}
    };

    function registerMapping(type, index, annotation) {
      if (!mappings[type][index]) mappings[type][index] = [];
      mappings[type][index].push(annotation);
    }

    _.each(annotations, function(a) {
      if (a.source === node.id && a.pos) {
        if (scope && scope.id !== a.target && !_.include(["emphasis", "strong", "subscript", "superscript"], a.type)) return; // skip
        result.push(a);
        registerMapping('starts', a.pos[0], a);
        registerMapping('ends', a.pos[0] + a.pos[1]-1, a);
      }
    });
    return mappings;
  }

  function renderAnnotatedContent(node, property) {
    property = property ? property : "content";
    var mappings = annotationsForNode(node);

    function tagsFor(type, index) {
      var annotations = mappings[type][index];
      var res = "";

      _.each(annotations, function(a) {
        if (a.key && a.key !== property) return; // skip annotation that don't match the property key
        
        // Special rendering for inline-formulas
        if (a.type === "inline_formula") {
          if (type === "starts") {
            var formula = content.nodes[a.target];
            if (formula.url) {
              // Display Image
              res += '<img src="'+formula.url+'"/>';
            } else {
              // Display MathJax
              res += '<mml:math xmlns="http://www.w3.org/1998/Math/MathML">';
              res += formula.content;
              res += '</mml:math>';
            }
          }
          return;
        }

        if (a.type === "link") {
          if (type === "starts") {
            res += '<a href="'+a.url+'" target="_blank">';
          } else {
            res += '</a>';
          }
          return;
        }

        if (type === "starts") {
          res += '<span data-id="'+a.id+'" class="annotation '+a.type+'">';
        } else {
          res += '</span>';
        }
      });
      return res;
    }


    if (!node[property]) return ''; // Skip undefined properties

    var output = "";

    _.each(node[property].split(''), function(ch, index) {
      // 1. prepend start tags
      output += tagsFor("starts", index);

      // 2. add character
      if (ch === '\n') ch = "<br/>";
      output += ch;

      // 3. append end tags
      output += tagsFor("ends", index);
    });
    return output;
  }

  return renderAnnotatedContent(this.node, this.property);
}

// Lens.Renderer
// ========

function Renderer(doc, view) {
  var nodes = doc.views[view];

  // Renders one content node using NodeRenderer
  // --------
  // 
  // Also provides utility functions that can be used by views
  // Usage:
  //    <%= annotate('text:15', 'content') %>
  //    <%= get('text:15').some_property %>

  function renderNode(nodeId, index) {

    var node = doc.nodes[nodeId];
    if (!node) console.log('error: node', nodeId, index);
    return _.tpl('node_'+node.type, {
      node: node,
      index: index,
      // Allow the view to spit out annotated content
      annotate: function(nodeId, property) {
        if (!nodeId) return "";
        var node = doc.nodes[nodeId];
        if (!node) console.log('error: node', nodeId, 'does not exist');
        return new NodeRenderer(node, doc, null, property).render(); 
      },
      // Get a node from the document by id
      // To be used within views
      get: function(nodeId) {
        return doc.nodes[nodeId];
      },
      doc: doc
    });
  }

  // Start the rendering process
  // ----------

  this.render = function() {
    var html = "";
    _.each(nodes, function(nodeId, index) {
      html += renderNode(nodeId, index);
    });
    return html;
  };
}

// Export
root.Lens.NodeRenderer = NodeRenderer;
root.Lens.Renderer = Renderer;

})(this);
