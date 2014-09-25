
var util = require("substance-util");
var articleMetaData = require("./data/article_meta_data");

var RelationshipsService = function() {
  this.data = require('./data/relationships_data');
};

RelationshipsService.Prototype = function() {

  this.getRelationShip = function(type, source, target, cb) {
    var _callback = function(result) {
      window.setTimeout(function() {
        cb(null, result);
      }, 1000);
    };
    for (var i = 0; i < this.data.length; i++) {
      var d = this.data[i];
      if (d.relationship_type === type && source === d.source && d.target === target) {
        return _callback(d);
      }
    }
    cb();
  };

  this.getRelationshipsForDOI = function(doi, cb) {
    var rels = [];

    var target = articleMetaData[doi];
    var source;

    if (!target) {
      return cb();
    }

    for (var i = 0; i < this.data.length; i++) {
      var d = this.data[i];
      if (d.type === 'insight' || d.type === 'advance' || d.type === 'key-reference') {
        if (d.target !== doi)  continue;
        source = articleMetaData[d.source];
        if (!source) throw new Error("No meta data found for " + d.source);
        rels.push({
          type: 'article_relationship',
          id: util.uuid(),
          relationship_type: d.type,
          source: source,
          target: target,
          description: d.description,
          creator: d.creator
        });
      } else if (d.type === 'co-published' && d.target.indexOf(doi) >= 0) {
        for (var j = 0; j < d.target.length; j++) {
          var doi2 = d.target[j];
          if (doi2 === doi) continue;
          source = articleMetaData[doi2];
          if (!source) throw new Error("No meta data found for " + d.source);
          rels.push({
            type: 'article_relationship',
            id: util.uuid(),
            relationship_type: d.type,
            source: source,
            target: target,
            description: d.description,
            creator: d.creator
          });
        }
      }
    }
    window.setTimeout(function() {
      cb(null, rels);
    }, 1000);
  };
};
RelationshipsService.prototype = new RelationshipsService.Prototype();

RelationshipsService.newInstance = function() {
  return new RelationshipsService();
};

module.exports = RelationshipsService;
