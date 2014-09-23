var http = require('http');
var express = require('express');
var path = require('path');
var _ = require("underscore");
var fs = require("fs");
var cjsserve = require('substance-cjs');

var app = express();

var port = process.env.PORT || 4001;
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

var config = require("./project.json");
cjsserve(app, '/index.html', 'lens.js', './boot.js', __dirname, 'lens', {
  blacklist: [
    'substance-commander',
    'substance-chronicle',
    'substance-operator'
  ]
});

app.use('/lib', express.static('lib'));
app.use('/lib/substance', express.static('node_modules'));
app.use('/node_modules', express.static('node_modules'));
app.use('/styles', express.static('styles'));
app.use('/src', express.static('src'));
app.use('/data', express.static('data'));
app.use('/config', express.static('config'));
app.use('/images', express.static('images'));

// Serve Lens in dev mode
// --------

app.use(app.router);

http.createServer(app).listen(port, function(){
  console.log("Lens running on port " + port);
  console.log("http://127.0.0.1:"+port+"/");
});
