var ResourceRenderer = require('../resource_renderer');
var KeyReferenceExtension = require('./key_reference_extension');

var ReferencesRenderer = function(docCtrl, relationships) {
  ResourceRenderer.call(this, docCtrl);
	this.relationships = relationships;
};

ReferencesRenderer.Prototype = function() {

  this.renderNodeView = function(node) {
  	var nodeView = ResourceRenderer.prototype.renderNodeView.call(this, node);

    var pubInfo = this.docCtrl.get('publication_info');

    var source = pubInfo.doi;
    var target = node.doi;

    // check if there are
    this.relationships.getRelationShip("key-reference", source, target, function(err, keyRefRel) {
    	if (err) {
    		console.error(err);
    		return;
    	} else if (keyRefRel) {
        var keyRefExt = new KeyReferenceExtension(nodeView, keyRefRel);
        keyRefExt.render();
      }
    });

    return nodeView;
  };

};

ReferencesRenderer.Prototype.prototype = ResourceRenderer.prototype;
ReferencesRenderer.prototype = new ReferencesRenderer.Prototype();

module.exports = ReferencesRenderer;
