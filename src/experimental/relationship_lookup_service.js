var RelationshipLookup = function() {
  this.data = require('./relationship_fixture');
};

RelationshipLookup.Prototype = function() {
  this.getRelationShip = function(type, source, target, cb) {
    for (var i = 0; i < this.data.length; i++) {
      var d = this.data[i];
      if (d.relationship_type === type && source === d.source && d.target === target) {
        window.setTimeout(function() {
          cb(null, d);
        }, 1000);
        return;
      }
    }
    cb();
  };
};
RelationshipLookup.prototype = new RelationshipLookup.Prototype();

module.exports = RelationshipLookup;
