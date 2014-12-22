# Setting up Lens
*This is a work in progress, and is not a finished document.*

This post douments how I've managed to set up Lens to run locally, and how I've been able bring into my Lens document a new node type, populated by the content of a custom element in the XML. It also includes some description and examples of what constitutes a Lens article node, and some more general notes on ways in to the code.

## Prerequisites
The top level prerequisites to get you started are listed below. There will be some more you'll come across along the way, for specific, optional tasks.

+ git
+ nodejs

### Get the core repos and install dependancies
```git clone https://github.com/elifesciences/lens```

and

```git clone https://github.com/substance/screwdriver``` (the Lens helper).

```cd``` to the screwdriver directory and build Lens with ```sudo python setup.py install```. Among other things this has created a ```lens/.screwdriver``` directory. In here you can find ```project.json``` that describes the submodules required for Lens, and ```module.json```, which is in the format of an npm package.json file.

Install everything else you'll need for the codebase by ```cd``` to the lens directory, then ```substance --update```.

Because there are many git repositories that together comprise Lens, you need to make sure that your Git operations are working on the correct branch, etc, for all of the repos concerned. The ```substance``` tool can help with this. To get a list of commands, type ```substance --help```. You've already used ```--update``` to get hold of everthing. Some other useful commands are:

+ ```substance --checkout```
+ ```substance --push```
+ ```substance --pull```
+ ```substance --git -- ...``` runs the provided git command on all submodules, for example ```substance --git -- reset```
+ ```substance --each -- ...``` similar to ```--git```, but runs the (not-necessarily git) command on all submodules. For example ```substance --each -- git remote add mine https://github.com/davidcmoulton/{{repoName}}``` adds remotes to my forks for all sub modules```

There are more commands. Consult the substance help for up-to-date info on behaviour and useage for all of them.

## Set up Sublime Text 2 (optional)
Substance provide a Sublime Text 2 package to make it a bit easier to handle Git interactions for Lens when you're dealing with multiple submodules at once. It provides easy key bindings to (as a minumum) check git status, to run the Git GUI client [git-gui](http://git-scm.com/docs/git-gui) and the Git repository browser [gitk](http://git-scm.com/docs/gitk) ([some useful docs on gitk](http://gitolite.com/gitk.html)) from within Sublime Text 2 itself. (The latter two only work if they're installed, get 'em if you want 'em.)

To install the Substance Sublime package, ```cd``` to where ST2 keeps its packages. On my Mac, that's ```~/Library/Application Support/Sublime Text 2/Packages/```, on Ubuntu it's ```~/.config/sublime-text-2/Packages/```. I've no idea where it is on a PC, but I'm sure you'll find it. Then clone the package with ```git clone https://github.com/substance/sublime substance```.

Once cloned, ```cd``` into ```substance``` and open the appropriate .sublime-keymap file for your OS to check what the keybindings are.  There are a bunch in there, the ones I find most useful are:

Check git status:
```
{ "keys": ["key_binding"], "command": "git_status" },
```

Once in the git status view, if there are any modified files this line handles firing up the git-gui:
```
{ "keys": ["key_binding"], "command": "git_gui", "context": [{"key": "git_status"}]},
```

Also when in the status view, this brings up gitk:
```
{ "keys": ["key_binding"], "command": "git_log", "context": [{"key": "git_status"}]}
```

Where ```key_binding``` is the key binding for the respective command. To use these commmands, set the key bindings to be unique: you may have to manage key binding conflicts with other modules if they use the same ones.

### Verify the key bindings
Open ```lens``` as a project in ST2.

Make an edit to any file within ```lens``` (for example ```lens/index.html```).

Once your change is saved, use the key combination that should trigger git status (see key bindings above). You should see a tab opened named ```.Git.Status```, which contains your git status for this project: you should see the file you just modified coming up as, well, modified!

To call up the diff in git-gui, hit the key combo for that one and verify git-gui opens.

To bring up gitk, hit the key combo for that one and verify gitk opens.

If they don't work, check you have the relavent tool installed, and that the keybinding is not being used for something else.

Once you've verified that these key bindings work as expected, commit or discard your change, then check git status again. You should now see the message "Everything committed. Yeaah!"

## Configure

+ Lens server runs by default on port 4001, this can be changed in ```lens/server.js```
+ The default document provided by the lens server is defined in ```lens/index.html```, it is set with the JavaScript variable ```documentURL```. This can be modified as required.

## Run
+ Spin up with ```node server``` and verify that the default document loads on ```http://localhost:4001``` (or whatever port you've reset it to).


## Contributing code

If you are going to write code that you want to contribute back to the lens communtiy, then you're going to be putting in pull requests to three repos: lens, lens-article[? TODO: verify this, and confirm specificity order], and lens-converter. When you have PRs into >1 repo that are for the same feature, make sure that you reference the *least* specific repo in the PRs for the other more-specific repo(s).

Obviously fork what you need to, and make sure you push to your forks, not the origin.

## Building Lens

You've made some super updates to Lens, you now want to deploy them onto your website, so you'll need to re-bundle Lens: there are a **lot** of JavaScript files that need concatonating, which Lens does using browserify.

The bundling settings are found at the bottom of ```lens/.screwdriver/project.json```

You'll need to install node modules browserify and uglify-js if you don't already have them on your system. Do this with ```sudo npm install -g browserify uglify-js```.

Then bundle with ```substance --bundle```. You should find a newly-created file at the location specified in the project.json file. By default this is within ```lens/dist/``` [TODO: THIS LAST STEP DOESN'T WORK: ./dist is generated, along with css & various other files, but the ./dist/lens.js file is not generated.]


# Some notes on the general architecture
This is an incomplete picture of how Lens is put together, based on my current understanding.

## Approach
+ Uses commonjs pattern for dependancy management
+ Icons are from Font Awesome
+ The view is controlled via the URI, or the model is updated to reflect the state implied by the URI (similar to Backbone)
+ MVC: see ```lens/src/lens_controller.js``` and ```lens/src/lens_view.js```
+ Top level application: ```Lens```, found in ```lens/src/lens.js```
+ Top level controller is ```LensController``` in ```lens/src/lens_controler.js```. Currently this has only one child: reader; ```ReaderController``` is a second level controller.
+ There are respective corresponding views, see ```LensView``` in ```lens/src/lens_view.js```, and ```ReaderView``` in ```lens/src/reader_view.js```. The way in to the view is the ```render``` function.
+ Use a constructor on a Prototype object, for example in ```lens/src/reader_view.js```:

```JavaScript
ReaderView.Prototype = function () {
  // set some properties on ReaderView using 'this'
};
ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;
```
+ The right hand panels are set up outside of the reader in ```lens/src/panel_specification.js``` Add to the ```panelSpecs``` object to add more panels. This is used by ```PanelFactory``` in ```lens/src/panel_factory.js```

+ Be aware of strict data typing. If a property has the value ```["array", "object"]```, this states that it is an array of objects.

## Misc notes

The index is generated using document.js API, this gives access to all annotations to a reference, figures etc.

lens outline controls the scroll bar document maps.

# A Lens article
A Lens article is a collection of nodes. There are 2 types of nodes.

## lens article nodes
These are found in ```lens/node_modules/lens-article/nodes/```.

These nodes are used to build the Lens article.

> Ninja-Note: the dependency to substance-nodes has been removed, as it depended on a rather old branch and the modern version is more related to
> editing and is unnecessarily complex. Overall, we try to go an independent way for nodes in future, thus all (built-in) nodes are found here.

## registering lens article nodes
For lens to know about the lens-article nodes available, they must be registered as dependencies; this happens in ```lens/node_modules/lens-article/nodes/index.js```. If you're creating a new node, you must register it in this file for it to take.

## What's in a node?

+ A node is defined within a directory that has the name of the node, so the definition of the substance base image node is found at the path ```lens/node_modules/substance-nodes/src/image/```.
+ A node definition always contains ```index.js```. This file manages the dependancices for the guts of the node definition (the model and the view). Continuing the previous example, the full contents of ```lens/node_modules/substance-nodes/src/image/index.js``` is:

```JavaScript
"use strict";

module.exports = {
  Model: require("./image"),
  View: require("./image_view")
};
```

Here we can see that the image node's model is defined in ```image.js```, and the its view is defined in ```image_view.js```.

### The model
Looking inside ```image.js``` at the definition of the image node's model, ```ImageNode```, like all nodes, has a type definition.

```JavaScript
ImageNode.type = {
  "id": "image",
  "parent": "webresource",
  "properties": {
    "source_id": "string"
  }
};
```
(*Note: it looks to me that ```ImageNode``` should be called ```Image``` to be consistent with how the other nodes are put together.*)

This is a quite a simple node as it's just for an image. Its parent is ```"webresource"``` but many nodes often have the parent of ```"content"```.

The ```HTMLTable``` lens article node is an example of a node with ```content``` as a parent. Its object model has more properties and is more complex than ```ImageNode```. Let's break down the ```HTMLTable``` node model (see ```lens/node_modules/lens-article/nodes/html_table```):

Dependencies are established, ```HTMLTable``` will be a ```Node```:
```JavaScript
var _ = require('underscore');
var Node = require('substance-document').Node;
```
Then the actual ```Lens.HTMLTable``` is created. Each node has a similar setup to this (with a slight difference if the type is composite document (```Document.Composite```) rather than a node).
```JavaScript
var HTMLTable = function(node, doc) {
  Node.call(this, node, doc);
};
```
Next the ```HTMLTable``` type is defined. Each node type has a similar structure, with ```id```, ```parent``` and ```properties```.
```JavaScript```
HTMLTable.type = {
  "id": "table",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "content": "string",
    "footers": ["array", "string"],
    "caption": "caption"
  }
};
```
Note that ```"footers": ["array", "string"]``` means that the ```footer``` property takes an array of strings.

Next a configuration option. Some node types have extra configuration like this, others don't.
```JavaScript
HTMLTable.config = {
  "zoomable": true
};
```

> Ninja-Note: Some node types are used in the context of resource panels. There they get a header bar, where a 'zoom' and a 'show' button may
> be provided.

Then there's the setting of a couple of documentation/example related properties ```HTMLTable.description``` and ```HTMLTable.example``` that we won't worry about here.

Then the prototype is set up. Each node type has a prototype defined in the same way (although what it exposes depends on the type, of course), except that in the case of composite documents, the object's ```Prototype.prototype``` is set to ```Document.Composite.prototype``` rather than ```Node.prototype```.
```JavaScript
HTMLTable.Prototype = function() {
  this.getCaption = function() {
    if (this.properties.caption) {
      return this.document.get(this.properties.caption);
    }
  };
};

HTMLTable.Prototype.prototype = Node.prototype;
HTMLTable.prototype = new HTMLTable.Prototype();
HTMLTable.prototype.constructor = HTMLTable;
```
Finally any getters are set up
```JavaScript
Node.defineProperties(HTMLTable);
```

Then we expose ```HTMLTable``` to the world, and we're done:
```JavaScript
module.exports = HTMLTable;
```

### The view
Let's take a look at the corresponding view for a table, which as you'll remember is held in ```html_table_view.js```.

Dependancies first:
```JavaScript
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;
```
(```$$``` is a substance helper to create elements, you can pass properties to be attribute values. It's a wrapper around ```ElementRenderer```)

Next create what will become the actual view (see Ninja-Note below about ```viewFactory```).
```JavaScript
var HTMLTableView = function(node, viewFactory) {
  NodeView.call(this, node);
  this.viewFactory = viewFactory;

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node table");
};

```

Add its prototype. In the prototype, the ```render``` function is where most of the action happens. If you're building a new type, this is where you'll control how it displays.
```JavaScript
HTMLTableView.Prototype = function() {

  this.render = function() {
    var node = this.node;
    NodeView.prototype.render.call(this);

    // The actual content
    // --------
    //

    var tableWrapper = $$('.table-wrapper', {
      html: node.content // HTML table content
    });

    this.content.appendChild(tableWrapper);

    // Display footers (optional)
    // --------
    //

    var footers = $$('.footers', {
      children: _.map(node.footers, function(footer) {
        return $$('.footer', { html: "<b>"+footer.label+"</b> " + footer.content });
      })
    });

    // Display caption


    var caption = this.node.getCaption();
    if (caption) {
      var captionView = this.viewFactory.createView(caption);
      var captionEl = captionView.render().el;
      this.content.appendChild(captionEl);
      // this.childrenViews.push(captionView);
    }

    this.content.appendChild(footers);


    // this.content.appendChild($$('.not-yet-implemented', {text: "This node type has not yet been implemented. "}));
    return this;
  }
  HTMLTableView.Prototype.prototype = NodeView.prototype;
  HTMLTableView.prototype = new HTMLTableView.Prototype();
  ```
  Then we let it loose into the world and we're done:
  ```JavaScript
module.exports = HTMLTableView;
```

> Ninja-Note: every view is provided with a view factory instance. This way it is possible to create views for sub-components,
> e.g., consider a form-like view where you want to enable rich-text support for its text components.
> Needless to say, that the factory is passed to every constructor to allow using different factories in
> different contexts. The factory would be used this way:
>
>     var componentView = this.createView(nodeId);
>     this.content.appendChild(componentView.render().el);

# Importing the xml into Lens
See ```lens/node_modules/lens-converter/lens_converter.js```.
The converter handles the mapping of xml data into the data model provided by the lens nodes. It's where you pull out parts of the xml you want to use in your Lens document.

There are a number of different publisher configurations for the converter. Currently they are all defined as dependancies for the ```Importer```, but as conceptually they are mutually exclusive, a refactoring to only include the required config would be useful.

> Ninja-Note: There are several ways to get a customized converter. Configurations are used as a post-processor, to 'enhance' extracted
> content. As of the current version, the configuration can be injected on application level. Such as:
>
>     var Lens = require('lens');
>     var MyLens = function(config) {
>       config = config || {};
>       config.converterOptions = {
>         config: new MyConverterConfiguration()
>       };
>       Lens.call(this, config);
>     };
>     MyLens.prototype = Lens.prototype;

> A cleaner solution is to provide a customized converter which overrides the method that is responsible for creating a
> configuration for a given XML document.
>
>     var Lens = require('lens');
>     var LensConverter = require('lens-converter');
>
>     var MyLens = function(config) {
>       config = config || {};
>       config.converter = new MyConverter()
>       Lens.call(this, config);
>     };
>     MyLens.prototype = new Lens.prototype;
>
>     var MyConverter = function(options) {
>       LensConverter.call(this, options);
>     };
>     MyConverter.Prototype = function() {
>       this.getConfiguration(xmlDoc) {
>         if (...sniff into xmlDoc and see if it is of a custom-type) {
>           return new MyConverterConfiguration();
>         } else {
>           return LensConverter.getConfiguration.call(this, xmlDoc);
>         }
>       };
>     };
>     MyConverter.Prototype.prototype = new LensConverter.prototype;
>     MyConverter.prototype = new MyConverter.Prototype();

# Enough theory, we need an example!
Let's create an new node type, add a declarative form of it to the XML as a new custom element, and render it in a Lens article. We will call it the Raptor. In the XML, the raptor element will be defined like this:
```
<my_raptor img_path="http://onlinefast.org/wwutoday/sites/onlinefast.org.wwutoday/files/raptor.jpg" short_description="Raptor!"></my_raptor>
```
Add this XML element to the default document for your local Lens, just before the ```</article>```, we will then be able to test the rendering in a browser.

In the rendered view, this XML will be transformed into an image tag, containing a reference to an image (a raptor, obviously) with alt text.

[Note that at the time of writing, NLM XML does not have a my_raptor element defined in the DTD, so the XML we create will not parse against the current NLM DTD. Clearly that's their loss :-)]

## Defining the new raptor node type
raptor will be a new lens article node (we don't create new substance nodes); first we need to give it a home:
```
cd lens/node_modules/lens-article/nodes
mkdir raptor
```

Note that we're calling the lens article node type ```raptor```, and the XML element ```<my_raptor>```. This is to emphasise which code relates to the JavaScript and which to the XML. Normally it may make more sense to call them by the same name.

Then create the definition for the new node:
```
cd raptor
touch index.js
```

and tell the index file where to find the raptor node's model and view (we'll make those next). In ```index.js```:

```JavaScript
"use strict";

module.exports = {
  Model: require('./raptor'),
  View: require('./raptor_view')
};
```

### Creating the model
Create the file to contain the raptor's model definition (```touch raptor.js```), then editing this:

First, setup the dependencies:

```JavaScript
"use strict";
var _ = require('underscore');
var Node = require('substance-document').Node;
```

Make the raptor a substance document node:

```
// Lens.Raptor
// -----------------
//

var Raptor = function(node, doc) {
  Node.call(this, node, doc);
};
```

Now let's add the actual data model of the raptor node:
```JavaScript
// Type definition
// -----------------
//

Raptor.type = {
  "id": "raptor",
  "parent": "content",
  "properties": {
      "img_path": "string",
      "short_description": "string"
    }
};
```
Notice the ```img_path``` and ```short_description``` properties. These have the same names as the XML attributes from our ```<my_raptor>``` element that will populate them. These JavaScript properties don't have to have the same name as their corresponding XML attributes, but why make things needlessly complicated?

[Note that ```state.nextId('raptor')``` ensures a unique id for instances of raptor nodes when there is more than one in a document.]

Next we set up up the prototype, in a pattern that should now be familiar:
```JavaScript
Raptor.Prototype = function() {

};

Raptor.Prototype.prototype = Node.prototype;
Raptor.prototype = new Raptor.Prototype();
Raptor.prototype.constructor = Raptor;
```

Then we augment the prototype with our raptor properties:
```JavaScript
Node.defineProperties(Raptor.prototype, ["img_path", "short_description"]);
```

And we expose our new type:
```JavaScript
module.exports = Raptor;
```

And the job's a good 'un. So now the full ```raptor.js``` file looks like this:
```JavaScript
"use strict";

var _ = require('underscore');
var Document = require('substance-document');

// Lens.Raptor
// -----------------
//

var Raptor = function(node, doc) {
  Document.Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Raptor.type = {
  "id": "raptor",
  "parent": "content",
  "properties": {
    "img_path": "string",
    "short_description": "string"
  }
};

Raptor.Prototype = function() {
  this.getHeader = function() {
    return "Raptor";
  };
};
Raptor.Prototype.prototype = Document.Node.prototype;
Raptor.prototype = new Raptor.Prototype();
Raptor.prototype.constructor = Raptor;

Document.Node.defineProperties(Raptor);

module.exports = Raptor;

```

### Creating the view
Create the file to contain the raptor's view definition (```touch raptor_view.js```), then editing this:

First, setup the dependencies:
```JavaScript
"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;
```

Then create the view object:
```JavaScript
var RaptorView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

};
```

Now setup the prototype, including the critical ```render``` method. This is where the action happens:
```JavaScript
RaptorView.Prototype = function() {

  // Render it
  // --------

  this.render = function () {
    var node = this.node;
    var raptorPath = this.node.img_path;
    var raptorDesc = this.node.short_description;
    var outEl;

    this.content = $$('div.content');
    outEl = document.createElement('img');
    if (raptorPath) {
      outEl.setAttribute('src', raptorPath);
       if (raptorDesc) {
          outEl.setAttribute('alt', raptorDesc);
       }
    }
    // this.content.appendChild($raptorEl.get(0));
    this.content.appendChild(outEl);
    this.el.appendChild(this.content);
    return this;
  };
};

RaptorView.Prototype.prototype = NodeView.prototype;
RaptorView.prototype = new RaptorView.Prototype();
RaptorView.prototype.constructor = RaptorView;
````

And finally expose the view:
```JavaScript
module.exports = RaptorView;
```

The full ```raptor_view.js``` should look like this:
```JavaScript
"use strict";

var _ = require('underscore');
var LensArticleNodes = require('lens-article/nodes');
var NodeView = LensArticleNodes['node'].View;
var ResourceView = require("lens-article").ResourceView;

var RaptorView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  ResourceView.call(this, options);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node raptor");
};

RaptorView.Prototype = function() {

  _.extend(this, ResourceView.prototype);

  // Render it
  // --------

  this.render = function () {
    NodeView.prototype.render.call(this);

    this.renderHeader();

    var raptorPath = this.node.img_path || 'data/raptor.jpg';
    var raptorDesc = this.node.short_description || 'This is Ravi Raptor';
    var outEl;

    outEl = document.createElement('img');
    outEl.setAttribute('src', raptorPath);
    outEl.setAttribute('alt', raptorDesc);

    this.content.appendChild(outEl);

    return this;
  };
};

RaptorView.Prototype.prototype = NodeView.prototype;
RaptorView.prototype = new RaptorView.Prototype();
RaptorView.prototype.constructor = RaptorView;

module.exports = RaptorView;
```

### Registering the node
Now we have defined raptor, our new lens article node type, we need to register it so it can be used. We do this in ```src/nodes/index.js```:

```JavaScript
"use strict";

module.exports = {
  "raptor": require("./raptor"),
};
```

If you want to extend the core Lens article format in an experimental stage, the recommended way to that is to use customized converter
that injects custom node definitions:

For example this is done in `./myconverter.js`:

```JavaScript
  ...

  this.createDocument = function() {
    // It is possible to inject custom node types directly into the LensArticle constructor
    var article = new LensArticle({
      nodeTypes: require('./nodes')
    });
    return article;
  };
  ...
```

### Adding a Raptor Panel

In our example we want to display raptor nodes in a dedicated raptor panel. Panels can be created in a declarative way on application level.


For that you need to derive from `Lens` and override `getPanelFactory()` (see `./src/lens_with_raptor.js`):

```JavaScript
var Lens = require('lens');

var LensWithRaptor = function(config) {
  Lens.call(this, config);
};

var raptorsPanel = {
  type: 'resource',
  container: 'raptors',
  label: 'Raptors',
  title: 'Raptors',
  icon: 'icon-twitter',
  viewFactory: Lens.ResourcePanelViewFactory
};

LensWithRaptor.Prototype = function() {
  this.getPanelFactory = function() {
    var panelSpecs = Lens.getDefaultPanelSpecification();
    panelSpecs.panels.raptors = raptorsPanel;
    panelSpecs.panelOrder = ['toc', 'raptors', 'figures', 'citations', 'definitions', 'info'];
    return new Lens.Reader.PanelFactory(panelSpecs);
  };
};
LensWithRaptor.Prototype.prototype = Lens.prototype;
LensWithRaptor.prototype = new LensWithRaptor.Prototype();
```

Pushing nodes to a panel can be achieved by providing a custom converter configuration (see `./src/myconfiguration.js`):

```JavaScript
  ...
  this.showNode = function(state, node) {
    _super.showNode.call(this, state, node);
    if (node.type === 'raptor') {
      state.doc.show('raptors', node.id);
    }
  };
  ...
```

Attention: this is works only if we create a corresponding 'view' node in the document (see `./src/myconverter.js`):

```JavaScript
    // add a container for raptor nodes, which will be presented in their own panel
    article.create({
      type: 'view',
      id: 'raptors',
      nodes: []
    });

```

> Ninja-Note: this should be derived from panel specifications in future

### Quick recap
Okay, so far we have:

+ a new xml element ```<my_raptor>```
+ a new lens article node definition for ```raptor```
+ a model for ```raptor```
+ a view for ```raptor```
+ and we've registered the new ```raptor``` node with Lens

### Update the converter
To actually populate our raptor node's model with the data from the raptor XML element, we need to update the converter. The converter is found at ```lens/node_modules/lens-converter/src/lens-converter.js```.

To get the raptor displaying, we need to add it to the ```article``` method. I've added this almost at the bottom of this method, just above:
```
    // Give the config the chance to add stuff
    state.config.enhanceArticle(this, state, article);
```

There is a lot of undocumented institutional knowledge in the converter, so tread carefully here. This is the code to add:

```JavaScript
    // Grab the raptors and put them in the  in the content (left hand side),
    // and the figures panel on the right hand side.
    var Raptor = {
      type: 'raptor',
      id: state.nextId('raptor'),
      img_path: article.querySelector('my_raptor').getAttribute('img_path'),
      short_description: article.querySelector('my_raptor').getAttribute('short_description')
    };

    doc.create(Raptor);
    doc.show('content', Raptor.id);
    doc.show('figures', Raptor.id, 0);
```

Note how the JavaScript Raptor object's properties are populated using DOM methods, querying off of our new ```<my_raptor>``` element in the XML. The arguments to ```querySelector``` are just CSS selector strings, so if you're used to using ```querySelector``` in HTML, or are used to jQuery selectors, this syntax should be familiar. If it's not, check out this [illustrative use of css selectors](http://davidcmoulton.github.io/css-selectors/).

The last two lines cause the raptor be displayed in the content panel (left hand side), and the figures panel. The names 'content' and 'figures' refer to types of panel, defined in ```len/src/panel_specification.js```.

### Test it!
There you have it. Make sure the lens server is running, and go to [http://localhost:4001](http://localhost:4001) (or whichever port you're using). Scroll down and you will find your raptor looming out of the main content; click on the Figures icon, and you should see your raptor menacing you from the top of the images list.

And that's one way you can create a custom node in Lens.
