var LensNodes = require('lens/article/nodes');

module.exports = {
  Model: require('./formula_reference.js'),
  View: LensNodes['resource_reference'].View
};
