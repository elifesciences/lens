var ContainerPanel = require('./panels/container_panel');

var figuresPanel = new ContainerPanel({
  type: 'resource',
  name: 'figures',
  container: 'figures',
  label: 'Figures',
  title: 'Figures',
  icon: 'icon-picture',
  references: ['figure_reference'],
  zoom: true,
});

var citationsPanel = new ContainerPanel({
  type: 'resource',
  name: 'citations',
  container: 'citations',
  label: 'References',
  title: 'References',
  icon: 'icon-link',
  references: ['citation_reference'],
});

var definitionsPanel = new ContainerPanel({
  type: 'resource',
  name: 'definitions',
  container: 'definitions',
  label: 'Glossary',
  title: 'Glossary',
  icon: 'icon-book',
  references: ['definition_reference'],
});

var infoPanel = new ContainerPanel({
  type: 'resource',
  name: 'info',
  container: 'info',
  label: 'Info',
  title: 'Article Info',
  icon: 'icon-info-sign',
  references: ['contributor_reference'],
});

module.exports = [
  figuresPanel, citationsPanel, definitionsPanel, infoPanel
];
