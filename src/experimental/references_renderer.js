var LensArticle = require("lens-article");
var KeyReferenceExtension = require('./key_reference_extension');

var ReferencesRenderer = function(docCtrl, relationships, options) {
  LensArticle.Renderer.call(this, docCtrl, options);
	this.relationships = relationships;
};

ReferencesRenderer.Prototype = function() {

  this.renderNodeView = function(node) {
  	var nodeView = LensArticle.Renderer.prototype.renderNodeView.call(this, node);

    var pubInfo = this.docCtrl.get('publication_info');

    var source = "doi:"+pubInfo.doi;
    var target = "doi:"+node.doi;

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

ReferencesRenderer.Prototype.prototype = LensArticle.Renderer.prototype;
ReferencesRenderer.prototype = new ReferencesRenderer.Prototype();

module.exports = ReferencesRenderer;
