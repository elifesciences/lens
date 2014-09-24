var LensArticle = require('lens-article');
var ResourceRenderer = require('./resource_renderer');

var panelSpecs = {
  content: {
    type: 'content',
    label: 'Text',
    title: 'Content',
    icon: 'icon-align-left',
    renderer: LensArticle.Renderer
  },
  toc: {
    type: 'toc',
    label: 'Content',
    title: 'Content',
    icon: 'icon-align-left',
    shouldBeVisible: function() {
      // TODO: maybe implement some logic to hide toc when there is no content
      return true;
    }
  },
  info: {
    type: 'resource',
    label: 'Info',
    title: 'Article Info',
    icon: 'icon-info-sign',
    references: ['contributor_reference'],
    renderer: ResourceRenderer
  },
  figures: {
    type: 'resource',
    label: 'Figures',
    title: 'Figures',
    icon: 'icon-picture',
    references: ['figure_reference'],
    renderer: ResourceRenderer
  },
  citations: {
    type: 'resource',
    label: 'References',
    title: 'References',
    icon: 'icon-link',
    references: ['citation_reference'],
    renderer: ResourceRenderer
  },
  definitions: {
    type: 'resource',
    label: 'Glossary',
    title: 'Glossary',
    icon: 'icon-book',
    references: ['definition_reference'],
    renderer: ResourceRenderer
  }
};

module.exports = panelSpecs;
