# Lens

**Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers.

- **Read the [announcement](http://elifesciences.org/elife-news/lens)**
- **Watch the [introduction video](http://vimeo.com/67254579).**
- **See Lens in [action](http://lens.elifesciences.org/00778)**

## Using Lens

Lens is a stand-alone web component that can be embedded into any web page. Just take the contents from the latest [distribution](https://github.com/elifesciences/lens/releases), then adjust the `document_url` parameter in `index.html`.

```js
// Endpoint must have CORS enabled, or file is served from the same domain as the app
var documentURL = "https://s3.amazonaws.com/elife-cdn/elife-articles/00778/elife00778.xml";

var app = new Lens({
  document_url: documentURL
});
```

Lens can display any NLM XML document or, alternatively, the Lens-native JSON representation. Lens is pure client-side Javascript, so anyone (even authors) can host their own documents on a regular webspace.

## Make your own Lens

Lens is meant to be extended and customized. The American Mathematical Society developed a [math extension](extensions/math) for the Lens Reader to display JATS files with Math content, i.e. environments and formulas. See the official [AMS Lens](https://github.com/AmerMathSoc/AMS-Lens) repo for a complete integration example.

However, now let's look into developing our own extensions.

### Prerequisites

For Lens development, you need to have Node.js >=0.10.x installed.

You need to repeat that install step whenever you updated the screwdriver repo.

### Setup

1. Clone the `lens-starter` repository

  ```bash
  $ git clone https://github.com/elifesciences/lens-starter.git
  ```

2. Fetch dependencies

  ```bash
  $ cd lens-starter
  $ npm install
  ```

3. Run the server

  ```bash
  ~/projects/lens-starter $ node server
  Lens running on port 4001
  http://127.0.0.1:4001/
  ```


### Converter

Lens can natively read the JATS (formerly NLM) format, thanks to its built-in converter.
Conversion is done on the client side using the browser-native DOM Parser.

You can find the implementation of Lens Converter [here](https://github.com/elifesciences/lens/blob/master/converter/lens_converter.js). Lens Converter is meant to be customized, so publishers can develop a their own flavor easily.


Each converter must have a method `test` that takes the XML document as well as the document url. The method is there to tell if the converter can handle the content or not. In the case of eLife we check for the `publisher-name` element in the XML. 


See: [lens/converter/elife_converter.js](https://github.com/elifesciences/lens/blob/master/converter/elife_converter.js)

```js
ElifeConverter.Prototype = function() {
  ...
  this.test = function(xmlDoc, documentUrl) {
    var publisherName = xmlDoc.querySelector("publisher-name").textContent;
    return publisherName === "eLife Sciences Publications, Ltd";
  };
  ...
};
```

A customized converter can override any method of the original LensConverter. However, we have designated some hooks that are intended to be customized. Watch for methods starting with `enhance`. For eLife we needed to resolve supplement urls, so we implemented an `enhanceSupplement` method, to resolve the `supplement.url` according to a fixed url scheme that eLife uses.

See: [lens/converter/elife_converter.js](https://github.com/elifesciences/lens/blob/master/converter/elife_converter.js)

```js
ElifeConverter.Prototype = function() {
  ...
  this.enhanceSupplement = function(state, node) {
    var baseURL = this.getBaseURL(state);
    if (baseURL) {
      return [baseURL, node.url].join('');
    } else {
      node.url = [
        "http://cdn.elifesciences.org/elife-articles/",
        state.doc.id,
        "/suppl/",
        node.url
      ].join('');
    }
  };
  ...
};
```

You can configure a chain of converters if you need to support different journals at a time for a single Lens instance.

See [src/my-lens.js](https://github.com/elifesciences/lens-starter/blob/master/src/my-lens.js)

```js
LensApp.Prototype = function() {
  this.getConverters = function(converterOptions) {
    return [
      new ElifeConverter(converterOptions),
      new PLOSConverter(converterOptions),
      new LensConverter(converterOptions)
    ]
  };
  ...
};
```

The `Converter.test` method will be called on each instance with the XML document to be processed. The one that returns `true` first will be used. You can change the order to prioritize converters over others.

### Custom Nodes

You may want to customize how information is displayed in Lens. Here's how it works.

#### Define node model and view

We can either define a completely new node or override an existing implementation.

The following example from the starter repo overrides the [Cover node](https://github.com/elifesciences/lens/blob/master/article/nodes/cover/cover_view.js) and adds a feedback link to the top.

See [lens-starter/src/nodes/cover/cover_view.js](https://github.com/elifesciences/lens-starter/blob/master/src/nodes/cover/cover_view.js)

```js
CustomCoverView.Prototype = function() {
  this.render = function() {
    CoverView.prototype.render.call(this);

    var refUrl = encodeURIComponent(window.location.href);

    // Add feeback info
    var introEl = $$('.intro.container', {
      children: [
        $$('.intro-text', {
          html: '<i class="fa fa-info"></i>&nbsp;&nbsp;<b>Lens</b> provides a novel way of viewing research'
        }),
        $$('a.send-feedback', {href: "mailto:feeback@example.com", text: "Send feedback", target: "_blank" })
      ]
    });

    // Prepend
    this.content.insertBefore(introEl, this.content.firstChild);
    
    return this;
  }
};
```

In this example only the view code is modified while the original model definition is being reused.

See [lens-starter/src/nodes/cover/index.js](https://github.com/elifesciences/lens-starter/blob/master/src/nodes/cover/index.js)

```js
var LensNodes = require("lens/article/nodes");
var CoverModel = LensNodes["cover"].Model;

module.exports = {
  Model: CoverModel,
  View: require('./cover_view')
};
```

In order to activate in that patched node, your custom converter has to instantiate a custom Lens Article instance.

See [lens-starter/src/custom_converter.js](https://github.com/elifesciences/lens-starter/blob/master/src/custom_converter.js#L23)

```js
var CustomNodeTypes = require("./nodes");

CustomConverter.Prototype = function() {
  ...
  // Override document factory so we can create a customized Lens article,
  // including overridden node types
  this.createDocument = function() {
    var doc = new LensArticle({
      nodeTypes: CustomNodeTypes
    });
    return doc;
  };
  ...
```

### Panels

Lens can easily be extended with a customized panel. It can be used to show additional information relevant to the displayed article. A few examples of what you could do:

- Pull in tweets that talk about the current article
- Pull in metrics (click count, number of articles citing that article etc.)
- Retrieve related articles dynamically (e.g. important ones that reference the existing one)

For demonstration we will look at the implementation of a simple Altmetrics panel. It will pull data asynchronously from the Altmetrics API (http://api.altmetric.com/v1/doi/10.7554/eLife.00005) and render the information in Lens.

#### Panel Definition

This is the main entry point for a panel.

See: [lens-starter/src/panels/altmetrics/index.js](https://github.com/elifesciences/lens-starter/blob/master/src/panels/altmetrics/index.js)

```js
var panel = new Panel({
  name: "altmetrics",
  type: 'resource',
  title: 'Altmetrics',
  icon: 'fa-bar-chart',
});

panel.createController = function(doc) {
  return new AltmetricsController(doc, this.config);
};
```

#### Panel Controller

Our custom controller provides a `getAltmetrics` method, that we will use in the view to fetch data from altmetrics.com asynchronously. Using the Substance Document API we retrieve the DOI, which is stored on the `publication_info` node.

See: [lens-starter/src/panels/altmetrics/altmetrics_controller.js](https://github.com/elifesciences/lens-starter/blob/master/src/panels/altmetrics/altmetrics_controller.js)

```js
var AltmetricsController = function(document, config) {
  PanelController.call(this, document, config);
};

AltmetricsController.Prototype = function() {
  ...
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
  ...
};
```

#### Panel View

The Panel View is where you define, what should be rendered in your custom panel. Your implementation needs to inherit from `Lens.PanelView` and define a render method. The implementation of the altmetrics panel is pretty simple. We will show the panel (`PanelView.showToggle`) as soon as data from altmetric.com has arrived.

See: [lens-starter/src/panels/altmetrics/index.js](https://github.com/elifesciences/lens-starter/blob/master/src/panels/altmetrics/altmetrics_view.js)

```js
var AltmetricsView = function(panelCtrl, config) {
  PanelView.call(this, panelCtrl, config);
  this.$el.addClass('altmetrics-panel');
  // Hide toggle on contruction, it will be displayed once data has arrived
  this.hideToggle();
};

AltmetricsView.Prototype = function() {
  ...
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
  ...
};
```

#### Activate Panel

Panels are enabled in the projects `app.js` file by manipulating the `panels` array.


See: [lens-starter/src/app.js](https://github.com/elifesciences/lens-starter/blob/master/src/app.js)


```js
var panels = Lens.getDefaultPanels();
```

This code adds the altmetrics panel to the next to last position (before the info panel). 

```js
var altmetricsPanel = require('./panels/altmetrics');
panels.splice(-1, 0, altmetricsPanel);
```


### Bundling

Lens uses gulp and browserify for bundling. Just run the `gulp` command.

```bash
$ gulp
```

You can find your bundle in the `dist` folder.

```bash
$ cd dist
$ python -m SimpleHTTPServer
```

To open one of the bundled samples you need open the following URL in your browser

```bash
http://127.0.0.1:8000/
```

Adjust the 'url' parameter to open a different document.

## A note on mobile

Mobile support has been removed with Lens 2.0 to reduce technical debt and iterate more quickly on features. Eventually the Lens team will come up with a dedicated reader for mobile. We want to solve it right, and eventually also ship native versions for iOS and Android.

## Credits

Lens was developed in collaboration between [UC Berkeley](http://bioegrad.berkeley.edu/) graduate student [Ivan Grubisic](http://www.linkedin.com/pub/ivan-grubisic/26/353/739) and [eLife](http://elifesciences.org). The team of [Substance](http://substance.io) is helping with the technical execution.

Substantial contributions were made by [HighWire](highwire.org), which launched Lens for a number of science journals in fall 2014 (The Journal of Biological Chemistry, The Plant Cell, Journal of Lipid Research, mBio®, and more). [The American Mathematical Society (AMS)](http://ams.org/) made Lens ready for advanced rendering of math articles.

Thanks go to the following people, who made Lens possible:

- Ivan Grubisic (concept, dev)
- Ian Mulvany (leadership)
- Oliver Buchtala (dev)
- Michael Aufreiter (dev)
- Graham Nott (infrastructure)
- Melissa Harrison (QA)
- Rebecca Close (converter)
- Felix Breuer (math)
- David Jones (math)
- Peter Krautzberger (math)
- Samo Korošec (design)
- Ian Hamilton (design)
- John Sack (guidance)
- Greg Schwartz (content variation)

