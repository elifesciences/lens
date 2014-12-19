*This document is a work in progress.*

# Lens Panel API

AMS uses this mechanism to show a math panel. eLife is displaying a related articles in a separate panel.

In order to demonstrate how to extend Lens we'll implement a simple AltMetrics panel for Lens. It will pull data asynchronously from the altmetrics API (http://api.altmetric.com/v1/doi/10.7554/eLife.00005)

# Define a new panel

```js
// altmetrics_panel.js
"use strict";

var Panel = require('lens').Panel;
var articleDataService = require('./article_data_service').instance();
var RelatedArticlesController = require('./related_articles_controller');

var panel = new Panel({
  type: 'resource',
  label: 'Related',
  title: 'Related',
  icon: 'icon-external-link',
});

panel.createController = function(doc) {
  return new RelatedArticlesController(doc, this.config, articleDataService);
};

module.exports = panel;
```

## external data service

see `article_data_service.js`