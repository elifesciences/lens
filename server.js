var http = require('http');
var express = require('express');
var CJSServer = require('substance-cjs');

var app = express();

var port = process.env.PORT || 4001;
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

var config = require("./.screwdriver/project.json");
new CJSServer(app, __dirname, 'lens')
  // ATTENTION: the second argument is the script which is resembled by injecting a list
  // of script tags instead. It must be exactly the same string which is used in the script src.
  .scripts('./boot.js', 'lens.js', {
    ignores: [
      'substance-commander',
      'substance-chronicle',
      'substance-operator'
    ]
  })
  // ... the same applies to the css file
  .styles(config.styles, 'lens.css')
  .page('/index.html');

app.use(express.static(__dirname));

// Serve Lens in dev mode
// --------

app.use(app.router);

http.createServer(app).listen(port, function(){
  console.log("Lens running on port " + port);
  console.log("http://127.0.0.1:"+port+"/");
});
