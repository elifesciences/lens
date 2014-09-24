var $$ = require("substance-application").$$;
var LensArticle = require('lens-article');

var addResourceHeader = function(docCtrl, nodeView) {
  var node = nodeView.node;
  var typeDescr = node.constructor.description;

  // Don't render resource headers in info panel (except for contributor nodes)
  // TODO: Do we really need 'collaborator'?
  if (docCtrl.view === "info" && node.type !== "contributor" && node.type !== "collaborator") {
    return;
  }

  var children = [
    $$('a.name', {
      href: "#",
      text: node.header ,
      "sbs-click": "toggleResource("+node.id+")"
    })
  ];

  var config = node.constructor.config;
  if (config && config.zoomable) {
    children.push($$('a.toggle-fullscreen', {
      "href": "#",
      "html": "<i class=\"icon-resize-full\"></i><i class=\"icon-resize-small\"></i>",
      "sbs-click": "toggleFullscreen("+node.id+")"
    }));
  }

  children.push($$('a.toggle-res', {
    "href": "#",
    "sbs-click": "toggleResource("+node.id+")",
    "html": "<i class=\"icon-eye-open\"></i><i class=\"icon-eye-close\"></i>"
  }));

  var resourceHeader = $$('.resource-header', {
    children: children
  });
  nodeView.el.insertBefore(resourceHeader, nodeView.content);
};

var createResourceRenderer = function(name, docCtrl) {
	return new LensArticle.Renderer(docCtrl, {
		afterRender: addResourceHeader
	})
};


var panelSpecs = {
	content: {
		type: 'content',
		label: 'Text',
		title: 'Content',
		icon: 'icon-align-left',
		createRenderer: function(name, docCtrl) {
			return new LensArticle.Renderer(docCtrl);
		}
	},
  toc: {
  	type: 'toc',
    label: 'Content',
    title: 'Content',
		icon: 'icon-align-left',
    shouldBeVisible: function(name, doc) {
    	// TODO: maybe implement some logic to hide toc when there is no content
    	return true;
    }
  },
  info: {
  	type: 'resource',
    label: 'Info',
    title: 'Article Info',
    icon: 'icon-info-sign',
    createRenderer: createResourceRenderer
  },
  figures: {
  	type: 'resource',
    label: 'Figures',
    title: 'Figures',
		icon: 'icon-picture',
    createRenderer: createResourceRenderer
  },
  citations: {
  	type: 'resource',
    label: 'References',
    title: 'References',
    icon: 'icon-link',
    createRenderer: createResourceRenderer
  },
  definitions: {
  	type: 'resource',
    label: 'Glossary',
    title: 'Glossary',
    icon: 'icon-book',
    createRenderer: createResourceRenderer
  }
};

module.exports = panelSpecs;
