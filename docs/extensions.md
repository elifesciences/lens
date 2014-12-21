*This document is a work in progress.*

<!-- Customize Lens / Panels -->
# Customize Lens

## Panels

<!--AMS uses this mechanism to show a math panel. eLife is displaying a related articles in a separate panel.-->

It is easy to extend Lens with a customized panel. It can be used to show additional information relevant to the displayed article. A few examples of what you could do:

- Pull in tweets that talk about current article
- Pull in metrics (click count, number of articles citing that article etc.)
- Retrieve related articles dynamically (e.g. important ones that reference the existing one)

For demonstration we will look at the implementation of a simple Altmetrics panel. It will pull data asynchronously from the Altmetrics API (http://api.altmetric.com/v1/doi/10.7554/eLife.00005) and render the information in Lens.

### Preparation

Please install and run [Lens Starter](http://github.com/elifesciences/lens-starter) first. Follow the instructions in the README.

### Panel Definition

This is the main entry point for a panel.

```js
// src/panels/altmetrics/index.js
"use strict";

var Panel = require('lens').Panel;
var AltmetricsController = require('./altmetrics_controller');

var panel = new Panel({
	name: "altmetrics",
  type: 'resource',
  label: 'Altmetrics',
  title: 'Altmetrics',
  icon: 'icon-bar-chart',
});

panel.createController = function(doc) {
  return new AltmetricsController(doc, this.config);
};

module.exports = panel;
```

### Panel Controller

```js
// src panels/altmetrics_controller.js

var PanelController = require("lens").PanelController;
var AltmetricsView = require("./altmetrics_view");

var AltmetricsController = function(document, config) {
  PanelController.call(this, document, config);
};

AltmetricsController.Prototype = function() {
  this.createView = function() {
    return new AltmetricsView(this, this.config);
  };

  this.getAltmetrics = function(cb) {
    var doi = this.document.get('publication_info').doi;

		$.ajax({
		  url: "http://api.altmetric.com/v1/doi/"+doi,
		  dataType: "json",
		}).done(function(res) {
			cb(null, res);
		}).error(function(err) {
			cb(err);
		});
  };
};

AltmetricsController.Prototype.prototype = PanelController.prototype;
AltmetricsController.prototype = new AltmetricsController.Prototype();

module.exports = AltmetricsController;
```


### Panel View

```js
var PanelView = require('lens').PanelView;

var AltmetricsView = function(panelCtrl, config) {
  PanelView.call(this, panelCtrl, config);

  this.$el.addClass('altmetrics-panel');

  // Hide toggle on contruction, it will be displayed once data has arrived
  this.hideToggle();
};

AltmetricsView.Prototype = function() {

  this.render = function() {
    var self = this;
    this.el.innerHTML = '';

    this.controller.getAltmetrics(function(err, altmetrics) {
      if (!err) {
        self.renderAltmetrics(altmetrics);  
      } else {
        console.error("Could not retrieve altmetrics data:", err);
      }
    });

    
    return this;
  };

  this.renderAltmetrics = function(altmetrics) {
    this.showToggle();

    var $altmetrics = $('<div class="altmetrics"></div>');
    $altmetrics.append($('<div class="label">Altmetric.com Score</div>'));
    $altmetrics.append($('<div class="value"></div>').text(altmetrics.score));

    $altmetrics.append($('<div class="label">Cited on Twitter</div>'));
    $altmetrics.append($('<div class="value"></div>').text(altmetrics.cited_by_tweeters_count));

    $altmetrics.append($('<div class="label">Readers on Mendeley</div>'));
    $altmetrics.append($('<div class="value"></div>').text(altmetrics.readers.mendeley));

    $altmetrics.append($('<div class="copyright">Data provided by <a href="http://altmetric.com">altmetrics.com</div>'));

    this.$el.append($altmetrics);
  };
};

AltmetricsView.Prototype.prototype = PanelView.prototype;
AltmetricsView.prototype = new AltmetricsView.Prototype();
AltmetricsView.prototype.constructor = AltmetricsView;

module.exports = AltmetricsView;
```

The controller provides a `getAltmetrics` method that we will use in the view to fetch
data from altmetrics.com asynchronously. Using the Substance Document API we retrieve the DOI, which is stored on the `publication_info` node.

### Activate Panel

In the app definition file `src/app.js` find the following line:

```js
var panels = Lens.getDefaultPanels();
```

Now you are able to manipulate that array to include

```js
var altmetricsPanel = require('./panels/altmetrics');
panels.splice(-1, 0, altmetricsPanel);
```

This code adds to panel to the next to last position (before the info panel).

## Extension