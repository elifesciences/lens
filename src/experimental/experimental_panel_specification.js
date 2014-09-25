
var panelSpec = require('../panel_specification');

var Controller = require("substance-application").Controller;
var relationshipsService = require('./relationships_service').newInstance();
var RelatedArticlesView = require('./related_articles_view');
var LensArticle = require('lens-article');


panelSpec.related_articles = {
  type: 'resource',
  label: 'Related',
  title: 'Related',
  icon: 'icon-external-link',
  shouldBeVisible: function() { return true; },
  createPanelController: function() {
    // just a stub controller
    return new Controller();
  },
  createPanelView: function(docCtrl) {
    return new RelatedArticlesView(docCtrl.getDocument(), LensArticle.Renderer, relationshipsService);
  }
};

module.exports = panelSpec;
