var LensNodes = require('../../../../article/nodes');

module.exports = {
  Model: LensNodes['citation'].Model,
  View: require('./citation_view')
};
