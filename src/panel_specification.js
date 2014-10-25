var LensArticle = require('lens-article');
var ResourcePanelViewFactory = require('./resource_panel_viewfactory');

var panelSpecs = {
  panels: {
    content: {
      type: 'document',
      container: 'content',
      label: 'Content',
      title: 'Content',
      icon: 'icon-align-left',
      viewFactory: LensArticle.ViewFactory
    },
    figures: {
      type: 'resource',
      container: 'figures',
      label: 'Figures',
      title: 'Figures',
      icon: 'icon-picture',
      references: ['figure_reference'],
      viewFactory: ResourcePanelViewFactory
    },
    citations: {
      type: 'resource',
      container: 'citations',
      label: 'References',
      title: 'References',
      icon: 'icon-link',
      references: ['citation_reference'],
      viewFactory: ResourcePanelViewFactory
    },
    definitions: {
      type: 'resource',
      container: 'definitions',
      label: 'Glossary',
      title: 'Glossary',
      icon: 'icon-book',
      references: ['definition_reference'],
      viewFactory: ResourcePanelViewFactory
    },
    info: {
      type: 'resource',
      container: 'info',
      label: 'Info',
      title: 'Article Info',
      icon: 'icon-info-sign',
      references: ['contributor_reference'],
      viewFactory: ResourcePanelViewFactory
    }
  },
  panelOrder: ['toc', 'figures', 'citations', 'definitions', 'info']
};

module.exports = panelSpecs;
