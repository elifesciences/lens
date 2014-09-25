
var View = require('substance-application').View;
var ArticleRelationship = require('lens-article').nodeTypes['article_relationship'];

var RelatedArticlesView = function(document, viewFactory, relationships) {
  View.call(this);
  this.$content = $('<div>').addClass('nodes');
  this.$el.addClass('surface related_articles')
  this.document = document;
  this.viewFactory = viewFactory;
  this.relationships = relationships;

  // HACK: to make this operational with outline
  this.doc = {
    container: {
      getTopLevelNodes: function() { return []; }
    }
  };

  this.$el.append(this.$content);
};

RelatedArticlesView.Prototype = function() {

  this.render = function() {
    this.$content.empty();
    var doi = this.document.get('publication_info').doi;

    var self = this;
    this.relationships.getRelationshipsForDOI(doi, function(err, rels) {
      if (err) {
        console.error("Could not retrieve related articles:", err);
        return;
      }
      if (rels && rels.length > 0) self.renderRelatedArticles(rels);
    });

    return this;
  };

  this.renderRelatedArticles = function(rels) {
    for (var i = 0; i < rels.length; i++) {
      var rel = new ArticleRelationship.Model(rels[i], this.document);
      var view = new ArticleRelationship.View(rel, this.viewFactory);
      view.render();
      this.$content[0].appendChild(view.el);
    }
  };

};

RelatedArticlesView.Prototype.prototype = View.prototype;
RelatedArticlesView.prototype = new RelatedArticlesView.Prototype();

module.exports = RelatedArticlesView;
