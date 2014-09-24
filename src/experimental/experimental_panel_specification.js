var panelSpec = require('../panel_specification');

var ReferencesRenderer = require('./references_renderer');
var RelationshipLookupService = require('./relationship_lookup_service');
var relationshipLookupService = new RelationshipLookupService();

panelSpec.citations.createRenderer = function(name, docCtrl) {
  return new ReferencesRenderer(docCtrl, relationshipLookupService);
};

module.exports = panelSpec;
