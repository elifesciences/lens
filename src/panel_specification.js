var LensArticle = require('lens-article');
var ResourceRenderer = require('./resource_renderer');

var panelSpecs = {
  panels: {
    content: {
      type: 'document',
      container: 'content',
      label: 'Content',
      title: 'Content',
      icon: 'icon-align-left',
      renderer: LensArticle.Renderer
    },
    figures: {
      type: 'resource',
      container: 'figures',
      label: 'Figures',
      title: 'Figures',
      icon: 'icon-picture',
      references: ['figure_reference'],
      renderer: ResourceRenderer
    },
    citations: {
      type: 'resource',
      container: 'citations',
      label: 'References',
      title: 'References',
      icon: 'icon-link',
      references: ['citation_reference'],
      renderer: ResourceRenderer
    },
    definitions: {
      type: 'resource',
      container: 'definitions',
      label: 'Glossary',
      title: 'Glossary',
      icon: 'icon-book',
      references: ['definition_reference'],
      renderer: ResourceRenderer
    },
    info: {
      type: 'resource',
      container: 'info',
      label: 'Info',
      title: 'Article Info',
      icon: 'icon-info-sign',
      references: ['contributor_reference'],
      renderer: ResourceRenderer
    }
  },
  panelOrder: ['toc', 'figures', 'citations', 'definitions', 'info']
};

module.exports = panelSpecs;
