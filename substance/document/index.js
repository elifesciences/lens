"use strict";

var _ = require("underscore");

var Document = require('./document');
Document.Container = require('./container');
Document.Controller = require('./controller');
Document.Node = require('./node');
Document.Composite = require('./composite');
// TODO: this should also be moved to 'substance-nodes'
// However, currently there is too much useful in it that is also necessary for the test-suite
// Maybe, we should extract such things into helper functions so that it is easier to
// create custom text based, annotatable nodes.
Document.TextNode = require('./text_node');

module.exports = Document;
