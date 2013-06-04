// Ken
// -----------------
// 
// A Visual Knowledge Browser

var Ken = {};

// Colors
// ------------

Ken.COLOR_PALETTES = {
  "greenish": ["#116436", "#659e47"],
  "blueish": ["#1763a9", "#293d7f", "#249fd7"],
  "redish": ["#8b1270", "#b10545", "#5c0b44", "#61290c"]
};

var OBJECTS_BY_PUBDATE_DESC = function(item1, item2) {
  var d1 = item1.properties.published_at;
  var d2 = item2.properties.published_at;
  var i1 = d1 ? new Date(d1).toISOString() : "0000";
  var i2 = d2 ? new Date(d2).toISOString() : "0000";

  return i1 === i2 ? 0 : (i1 > i2 ? -1 : 1);
};

// Ken.Session
// -----------------

Ken.Session = function(collection) {
  // The original collection
  this.collection = collection;
  this.filteredCollection = collection;

  this.filterValueCount = 0;
  this.filters = {};
  this.matches = {};
  this.colors = new ColorPool(Ken.COLOR_PALETTES);
  this.initValueMap();
};

_.extend(Ken.Session.prototype, _.Events, {

  addFilter: function(property, value) {
    if (!this.filters[property]) this.filters[property] = {};
    this.filters[property][value] = {
      color: this.colors.getNext()
    };
    this.filterValueCount += 1;
    this.filter();
  },

  removeFilter: function(property, value) {
    delete this.filters[property][value];
    this.filterValueCount -= 1;
    this.filter();
  },

  // Getting deltas based on prev state and new state
  getDelta: function() {
    if (this.prevFilteredCollection) {
      return {
        "enter": this.filteredCollection.difference(this.prevFilteredCollection).objects,
        "update": this.filteredCollection.intersection(this.prevFilteredCollection).objects,
        "exit": this.prevFilteredCollection.difference(this.filteredCollection).objects
      }
    } else {
      return {
        "enter": this.filteredCollection.objects,
        "update": [],
        "exit": []
      }
    }
  },

  // Compute collection based on filters
  filter: function() {
    var that = this;

    // Reset matches
    this.matches = {};

    function flattenFilters() {
      var filters = [];
      _.each(that.filters, function(f, key) {
        _.each(f, function(bla, val) {
          filters.push({
            property: key,
            value: val
          });
        });
      });
      return filters;
    }

    function registerMatch(o, filter) {
      var obj = that.matches[o._id];
      if (!obj) obj = that.matches[o._id] = [];
      obj.push(filter);
    }

    var filters = flattenFilters();

    this.prevFilteredCollection = this.filteredCollection;

    // Join 'em together
    if (filters.length > 0) {

      var filteredObjects = [];
      _.each(filters, function(f) {
        var objects = this.valueMap[f.property][f.value];
        _.each(objects, function(o) {
          registerMatch(o, [f.property, f.value]);
          filteredObjects.push(o);
        }, this);
      }, this);

      var OBJECTS_BY_RELEVANCE = function(item1, item2) {
        var i1 = that.getMatchesForObject(item1);
        var i2 = that.getMatchesForObject(item2);
        return i1 === i2 ? 0 : (i1 > i2 ? -1 : 1);
      };

      var OBJECTS_BY_RELEVANCE_AND_PUBDATE = function(item1, item2) {
        var d1 = item1.properties.published_at || "2000-01-01";
        var d2 = item2.properties.published_at || "2000-01-01";
        var i1 = that.getMatchesForObject(item1) + new Date(d2).toISOString();
        var i2 = that.getMatchesForObject(item2) + new Date(d1).toISOString();
        return i1 === i2 ? 0 : (i1 < i2 ? -1 : 1);
      };

      filteredObjects = _.uniq(filteredObjects).sort(OBJECTS_BY_RELEVANCE_AND_PUBDATE);
    } else { // no filters set
      filteredObjects = this.collection.objects.sort(OBJECTS_BY_PUBDATE_DESC);
    }

    this.filteredCollection = new Data.Collection({
      "type": {
        "_id": this.collection.type._id,
        "name": this.collection.type.name,
        "properties": this.collection.type.properties,
      },
      "objects": []
    });

    _.each(filteredObjects, function(o) {
      that.filteredCollection.add(o);
    });

    this.trigger('data:changed');
  },

  getMatchesForObject: function(o) {
    var that = this;
    return _.map(this.matches[o._id], function(filter) {
      return that.filters[filter[0]][filter[1]];
    });
  },

  // Based on current filter criteria, get facets
  getFacets: function() {
    var that = this;
    var facets = {};

    _.each(this.collection.type.properties, function(p, key) {
      if (!p.meta || !p.meta.facet) return;

      function getRelatedObjects(property, value) {
        var objects = [];
        _.each(that.valueMap[property][value], function(o) {
          if (that.filteredCollection.get(o._id)) objects.push(o);
        });
        return objects;
      }

      function getAvailableValues() {
        // Extract available values
        var values = [];
        _.each(that.valueMap[key], function(objects, value) {
          // if (that.filters[key] && that.filters[key][value]) return;
          values.push({
            val: value,
            objects: objects,
            relatedObjects: getRelatedObjects(key, value),
            selected: that.filters[key] && that.filters[key][value],
            color: that.filters[key] && that.filters[key][value] ? that.filters[key][value].color : null
          });
        });
        return values;
      }

      // Delete?
      function getSelectedValues() {
        var values = [];
        _.each(that.filters[key], function(filter, val) {
          values.push({
            val: val,
            objects: that.valueMap[key][val],
            relatedObjects: getRelatedObjects(key, val),
            color: filter.color
          });
        });
        return values;
      }

      // Find max object count
      var availableValues = getAvailableValues();
      var selectedValues  = getSelectedValues();
      var maxCount = Math.max.apply(this, _.map(availableValues.concat(selectedValues), function(v) {
        return v.objects.length
      }));

      // Sort functions
      var VALUES_BY_RELEVANCE = function(item1, item2) {
        var i1 = item1.relatedObjects.length;
        var i2 = item2.relatedObjects.length;

        return i1 === i2 ? 0 : (i1 > i2 ? -1 : 1);
      };
      
      var VALUES_BY_FREQUENCY = function(item1, item2) {
        var i1 = item1.objects.length;
        var i2 = item2.objects.length;

        return i1 === i2 ? 0 : (i1 > i2 ? -1 : 1);
      };

      var VALUES_BY_RELEVANCE_AND_FREQUENCY = function(item1, item2) {
        var byRelevance = VALUES_BY_RELEVANCE(item1, item2);
        if (byRelevance !== 0) return byRelevance;
        return VALUES_BY_FREQUENCY(item1, item2);
      };

      availableValues = availableValues.sort(VALUES_BY_FREQUENCY);
      selectedValues = selectedValues.sort(VALUES_BY_RELEVANCE_AND_FREQUENCY);

      facets[key] = {
        property: p,
        name: p.name,
        availableValues: availableValues,
        selectedValues: selectedValues,
        values: [],
        maxObjectCount: maxCount,
        scale: function(count) {
          return count*60/maxCount; // pixel space = 60px
        }
      };
    });
    return facets;
  },

  initValueMap: function() {
    var that = this;

    this.valueMap = {};

    function extractValues(key) {
      var values = {};

      function registerVal(val, o) {
        if (values[val]) {
          values[val].push(o);
        } else {
          values[val] = [o];
        }
      }

      _.each(that.collection.objects, function(o) {
        var vals = o.properties[key];
        vals = _.isArray(vals) ? vals : [ vals ];
        
        _.each(vals, function(v) {
          registerVal(v, o);
        });
      });
      return values;
    }

    _.each(this.collection.type.properties, function(p, key) {
      that.valueMap[key] = extractValues(key);
    }, this);
  }
});



// Ken.Matrix
// -----------------
// 
// Matrix Plot

Ken.Matrix = Backbone.View.extend({

  // Update matrix with 
  // -----------------
  // 

  update: function() {
    var delta = this.model.getDelta();

    // Re-render everything for now
    this.$el.empty();

    _.each(this.model.filteredCollection.objects, function(item) {
      var element = this.newItem(item);
      this.$el.append(element);
    }, this);
  },

  // Constructs a new matrix item based on a template
  // -----------------
  // 

  newItem: function(item) {
    var html = _.tpl('item', {
      item: item,
      matches: this.model.getMatchesForObject(item)
    });
  
    return $($.parseHTML(html));
  },

  // Initial render of matrix
  // -----------------
  // 

  render: function() {
    this.update();
    return this;
  }
});



// Ken.Facets
// -----------------

Ken.Facets = Backbone.View.extend({
  events: {
    'click a.value.add': 'addValue',
    'click a.value.remove': 'removeValue'
  },
  
  // Set a new filter
  addValue: function(e) {
    var property = $(e.currentTarget).attr('data-property'),
        value = $(e.currentTarget).attr('data-value');
    this.model.addFilter(property, value);
    return false;
  },
  
  // Set a new filter
  removeValue: function(e) {
    var property = $(e.currentTarget).attr('data-property'),
        value = $(e.currentTarget).attr('data-value');
    this.model.removeFilter(property, value);
    return false;
  },

  initialize: function(options) {

  },
  
  render: function() {;
    $(this.el).html(_.tpl('facets', {
      collection: this.model.collection,
      filters: this.model.filters,
      facets: this.model.getFacets()
    }));
    return this;
  }
});


// Ken.Browser
// -------------------

Ken.Browser = Backbone.View.extend({
  events: {

  },
  
  initialize: function(options) {
    this.model.filter();
    this.model.bind('data:changed', this.update, this);
  },
  
  // Update plot and facets
  update: function() {
    this.matrix.update();
    this.facets.render();

    $('#facets .article-count').html('Showing '+ this.model.filteredCollection.length+' out of '+ this.model.collection.length+' articles');
  },
  
  render: function() {
    var that = this;
    // Should be rendered just once
    $(this.el).html(_.tpl('browser', this.model));

    this.facets = new Ken.Facets({model: this.model, el: this.$('#facets')});
    this.matrix = new Ken.Matrix({model: this.model, el: this.$('#matrix')});
      
    // Initially render the facets
    this.facets.render();

    that.matrix.render();
    return this;
  }
});