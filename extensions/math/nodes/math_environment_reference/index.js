var LensNodes = require('lens/article/nodes');

module.exports = {
  Model: require('./math_environment_reference.js'),
  View: LensNodes['resource_reference'].View
};
