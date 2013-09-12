var http = require('http');
var express = require('express');
var path = require('path');

var CommonJSServer = require("substance-application/commonjs");
var ConverterServer = require("substance-converter/src/server");
var Article = require("lens-article");

var _ = require("underscore");


// Useful general purpose helpers
// --------
//

function getFile(url, cb) {
  var request = require("request");

  request(url, function (err, res, body) {
    if (err || res.statusCode !== 200) return cb(err || 'Nope');
    cb(null, body);
  });
};

// var Converter = require("substance-converter");

var Handlebars = require("handlebars");
var fs = require("fs");

var app = express();
var commonJSServer = new CommonJSServer(__dirname);
commonJSServer.boot({alias: "lens", source: "./src/lens.js"});

var port = process.env.PORT || 4000;
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

app.get("/",
  function(req, res, next) {

    var template = fs.readFileSync(__dirname + "/index.html", 'utf8');

    var scripts = commonJSServer.list();

    var scriptsTags = scripts.map(function(script) {
      return ['<script type="text/javascript" src="/scripts', script, '"></script>'].join('');
    }).join('\n');

    var result = template.replace('#####scripts#####', scriptsTags);

    res.send(result);
  }
);

app.use('/lib', express.static('lib'));
app.use('/lib/substance', express.static('node_modules'));
app.use('/node_modules', express.static('node_modules'));
app.use('/styles', express.static('styles'));
app.use('/src', express.static('src'));
app.use('/data', express.static('data'));
app.use('/config', express.static('config'));
app.use('/images', express.static('images'));

app.get("/scripts*",
  function(req, res, next) {
    var scriptPath = req.params[0];
    res.type('text/javascript');
    try {
      var script = commonJSServer.getScript(scriptPath);
      res.send(script);
    } catch (err) {
      res.send(err.stack);
    }
  }
);



// Serve the Substance Converter
// Provides on the fly conversion for different markup formats
// --------

var converter = new ConverterServer(app);
converter.serve();




// Serves auto-generated doc, that describes the Lens.Article specification
// --------
//

app.get('/data/lens_article.json', function(req, res) {
  res.json(Article.describe());
});

// Adds some stuff like cover nodes to the converted docs based on some internal assumptions
// --------

function lensify(doc) {
  // Hotpatch schema
  doc.schema = ["lens-article", "0.1.0"];
  var docNode = doc.nodes.document;
  docNode.title = docNode.guid;
  docNode.authors = ["michael", "ivan", "rebecca"];

  if (docNode.title === "manual") {
    docNode.title = "The Lens Manual - A developers guide for Lens application development";
  } else if (docNode.title === "about") {
    docNode.title = "eLife Lens: A novel way of seeing content";
  } else if (docNode.title === "substance_scientist") {
    docNode.title = "Substance Scientist: A web-based editor component designed for academics";
  } else if (docNode.title === "lens_article") {
    docNode.title = "The anatomy of a Lens Article";
  }

  _.extend(doc.nodes, {
    "cover": {
      "id": "cover",
      "authors": [],
      "type": "cover"
    },

    "michael": {
      "id": "michael",
      "type": "person",
      "name": "Michael Aufreiter"
    },
    "ivan": {
      "id": "ivan",
      "type": "person",
      "name": "Ivan Grubisic"
    },
    "rebecca": {
      "id": "rebecca",
      "type": "person",
      "name": "Rebecca Close"
    }
  });

  // Insert cover node
  doc.nodes["content"].nodes.splice(0, 0, "cover");
  // var arr = [1].concat(arr);
  // splice(0,0,"x")
};


// Serve a doc from the docs folder (powered by on the fly markdown->substance conversion)
// --------

app.get('/data/:doc.json', function(req, res) {
  var docId = req.params.doc;

  var inputData;
  try {
    var filename = __dirname + "/node_modules/lens-manual/"+docId+".md";
    inputData = fs.readFileSync(filename, 'utf8');
    converter.convert(inputData, 'markdown', 'substance', function(err, output) {
      output = output.toJSON();
      output.id = docId;
      output.nodes.document.guid = docId;

      if (err) return res.send(500, err);
      lensify(output);
      res.send(output);
    });
  } catch (err) {
    inputData = fs.readFileSync(__dirname + "/data/"+docId+".json", 'utf8');
    res.send(inputData);
  }
});


// Serve the Substance Converter
// --------

// new Converter.Server(app).serve();

app.use(app.router);

http.createServer(app).listen(port, function(){
  console.log("Lens running on port " + port);
  console.log("http://127.0.0.1:"+port+"/");
});
