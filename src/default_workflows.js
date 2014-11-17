
var ToggleResourceReference = require('./workflows/toggle_resource_reference');
var FollowCrossRefs = require('./workflows/follow_crossrefs');
var JumpToTop = require('./workflows/jump_to_top');

var workflows = [
  new ToggleResourceReference(),
  new FollowCrossRefs(),
  new JumpToTop()
];

module.exports = workflows;
