
var $$ = require("substance-application").$$;
var LensArticle = require("lens-article");

var addResourceHeader = function(docCtrl, nodeView) {
  var node = nodeView.node;

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

var ResourceRenderer = function(docCtrl, options) {
  options = options || {};
  options.afterRender = addResourceHeader;
  LensArticle.Renderer.call(this, docCtrl, options);
};
ResourceRenderer.prototype = LensArticle.Renderer.prototype;

module.exports = ResourceRenderer;
