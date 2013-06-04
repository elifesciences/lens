if (typeof Substance === 'undefined') Substance = {};
if (typeof Substance.util === 'undefined') Substance.util = {};

(function(ctx){

var util = {};

var env = (typeof exports === 'undefined') ? 'composer' : 'hub';

if (typeof exports !== 'undefined') {
  var fs = require('fs');
  var _ = (env == 'hub') ? require('underscore') : _;
} else {
  var _ = ctx._;
}



// UUID Generator
// -----------------

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

util.uuid = function (prefix, len) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
      uuid = [],
      radix = 16,
      len = len || 32;

  if (len) {
    // Compact form
    for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (var i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random()*16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return (prefix ? prefix : "") + uuid.join('');
};


// Events
// ---------------

// Taken from Backbone.js
// 
// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, util.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

util.Events = {

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events || (this._events = {});
    var events = this._events[name] || (this._events[name] = []);
    events.push({callback: callback, context: context, ctx: context || this});
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _.once(function() {
      self.off(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function(name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
    if (!name && !callback && !context) {
      this._events = {};
      return this;
    }

    names = name ? [name] : _.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      if (events = this._events[name]) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) delete this._events[name];
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(name) {
    if (!this._events) return this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, arguments);
    return this;
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function(obj, name, callback) {
    var listeners = this._listeners;
    if (!listeners) return this;
    var deleteListener = !name && !callback;
    if (typeof name === 'object') callback = this;
    if (obj) (listeners = {})[obj._listenerId] = obj;
    for (var id in listeners) {
      listeners[id].off(name, callback, this);
      if (deleteListener) delete this._listeners[id];
    }
    return this;
  }

};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
var eventsApi = function(obj, action, name, rest) {
  if (!name) return true;

  // Handle event maps.
  if (typeof name === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
    return false;
  }

  // Handle space separated event names.
  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, l = names.length; i < l; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
    return false;
  }

  return true;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function(events, args) {
  var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
  switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
  }
};

var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

// Inversion-of-control versions of `on` and `once`. Tell *this* object to
// listen to an event in another object ... keeping track of what it's
// listening to.
_.each(listenMethods, function(implementation, method) {
  util.Events[method] = function(obj, name, callback) {
    var listeners = this._listeners || (this._listeners = {});
    var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
    listeners[id] = obj;
    if (typeof name === 'object') callback = this;
    obj[implementation](name, callback, this);
    return this;
  };
});

// Aliases for backwards compatibility.
util.Events.bind   = util.Events.on;
util.Events.unbind = util.Events.off;


// Async Control Flow for the Substance
// --------

util.async = function(funcs, data_or_cb, cb) {
  var data = null;

  // be tolerant - allow to omit the data argument
  if (arguments.length == 2) {
    cb = data_or_cb;
  } else if (arguments.length == 3) {
    data = data_or_cb;
  } else {
      throw "Illegal arguments.";
  }

  if (Object.prototype.toString.call(cb) !== '[object Function]') {
    throw "Illegal arguments: a callback function must be provided";
  }

  if (!data) data = {};

  var index = 0;
  var args = [];

  function process(data) {
    var func = funcs[index];

    // stop if no function is left
    if (!func) {
      return cb(null, data);
    }

    // A function that is used as call back for each function
    // which does the progression in the chain via recursion.
    // On errors the given callback will be called and recursion is stopped.
    var recursiveCallback = function(err, data) {
      // stop on error
      if (err) return cb(err, null);

      index += 1;
      process(data);
    };

    // catch exceptions and propagat
    try {
      func(data, recursiveCallback);
    } catch (err) {
      console.log("util.async caught error:", err.stack);
      cb(err);
    }
  }

  // start processing
  process(data);
}

function util_async_each(options) {
  return function(data, cb) {
    // retrieve items via selector if a selector function is given
    var items = options.selector ? options.selector(data) : options.items;

    // don't do nothing if items is not there
    if (!items) return cb(null, data);

    var isArray = _.isArray(items);

    if (options.before) {
      options.before(data);
    }

    var funcs = [];
    var iterator = options.iterator;

    // TODO: discuss convention for iterator function signatures.
    // trying to achieve a combination of underscore and node.js callback style
    function arrayFunction(item, index) {
      return function(data, cb) {
        if (iterator.length === 2) {
          iterator(item, cb);
        } else if (iterator.length === 3) {
          iterator(item, index, cb);
        } else {
          iterator(item, index, data, cb);
        }
      };
    }

    function objectFunction(value, key) {
      return function(data, cb) {
        if (iterator.length === 2) {
          iterator(value, cb);
        } else if (iterator.length === 3) {
          iterator(value, key, cb);
        } else {
          iterator(value, key, data, cb);
        }
      };
    }

    if (isArray) {
      for (var idx = 0; idx < items.length; idx++) {
        funcs.push(arrayFunction(items[idx], idx));
      }
    } else {
      for (var key in items) {
        funcs.push(objectFunction(items[key], key));
      }
    }

    //console.log("Iterator:", iterator, "Funcs:", funcs);
    util.async(funcs, data, cb);
  };
}

// Creates an each-iterator for util.async chains
// -----------
//
//     var func = util.async.each(items, function(item, [idx, [data,]] cb) { ... });
//     var func = util.async.each(options)
//
// options:
//    items:    the items to be iterated
//    selector: used to select items dynamically from the data provided by the previous function in the chain
//    before:   an extra function called before iteration
//    iterator: the iterator function (item, [idx, [data,]] cb)
//       with item: the iterated item,
//            data: the propagated data (optional)
//            cb:   the callback

util.async.each = function(options_or_items, iterator) {
  var options;
  if (arguments.length == 1) {
    options = options_or_items;
  } else {
    options = {
      items: options_or_items,
      iterator: iterator
    }
  }
  return util_async_each(options);
};

util.propagate = function(data, cb) {
  return function(err, ignoredData) {
    if (err) return cb(err);
    cb(null, data);
  }
}



// shamelessly stolen from backbone.js:
// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var ctor = function(){};
util.inherits = function(parent, protoProps, staticProps) {
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ parent.apply(this, arguments); };
  }

  // Inherit class (static) properties from parent.
  _.extend(child, parent);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) _.extend(child.prototype, protoProps);

  // Add static properties to the constructor function, if supplied.
  if (staticProps) _.extend(child, staticProps);

  // Correctly set child's `prototype.constructor`.
  child.prototype.constructor = child;

  // Set a convenience property in case the parent's prototype is needed later.
  child.__super__ = parent.prototype;

  return child;
};

// Util to read seed data from file system
// ----------

util.getJSON = function(resource, cb) {
  if (env == 'hub') {
    var obj = JSON.parse(fs.readFileSync(resource, 'utf8'));
    cb(null, obj);
  } else {
    $.getJSON(resource)
      .done(function(obj) { cb(null, obj); })
      .error(function(err) { cb(err, null); });
  }
}

var SEEDS_DIR = "./tests/seeds";

// To be refactored

util.prepareSeedSpec = function(seedSpec, cb) {

    var _seedSpec = {}
    _seedSpec.localFiles = _.isArray(seedSpec.local) ? seedSpec.local : ((seedSpec.local) ? [seedSpec.local] : []);
    _seedSpec.remoteFiles = _.isArray(seedSpec.remote) ? seedSpec.remote : ((seedSpec.remote) ? [seedSpec.remote] : []);
    _seedSpec.requires = _.isArray(seedSpec.requires) ? seedSpec.requires : ((seedSpec.requires) ? [seedSpec.requires] : []);
    _seedSpec.hubFile = seedSpec.hub;
    _seedSpec.hub = {};
    _seedSpec.local = {};
    _seedSpec.remote = {};
    _seedSpec.dir = seedSpec.dir;

    cb(null, _seedSpec);
}

util.loadSeedSpec = function (seedName, cb) {

  //console.log("Loading spec...", seedName, data);
  var location = [SEEDS_DIR, seedName, 'seed.json'].join('/');
  util.getJSON(location, function(err, seedSpec) {
    if (err) return cb(err);
    // storing the file info into the seed spec
    seedSpec.dir = [SEEDS_DIR, seedName].join('/');;
    util.prepareSeedSpec(seedSpec, cb);
  });
}

util.loadSeed = function(seedSpec, cb) {

  var seedsDir = seedSpec.dir || SEEDS_DIR;

  var loadRequiredSeeds = util.async.each({
    // before: function(seed) { console.log("Loading referenced seeds", seedName); },
    selector: function(seedSpec) { return seedSpec.requires; },
    iterator: function(seedName, idx, seedSpec, cb) {
      if (!seedName) return cb(null, seedSpec);
//      console.log("Loading referenced seed", seedName);
      util.loadSeedSpec(seedName, function(err, otherSeedSpec) {
//        console.log("Loaded referenced seed spec", seedSpec);
        if (err) return cb(err);
        util.loadSeed(otherSeedSpec, function(err, otherSeed) {
          if (err) return cb(err);
          _.extend(seedSpec.hub, otherSeed.hub);
          _.extend(seedSpec.local, otherSeed.local);
          _.extend(seedSpec.remote, otherSeed.remote);
          cb(null, seedSpec);
        });
      });
    }
  });

  function loadHubSeed(seed, cb) {
    if (!seed.hubFile) return cb(null, seed);
    var location = [seedsDir, seed.hubFile].join('/');
    console.log("loading hub seed file from", location);
    util.getJSON(location, function(err, hubSeed) {
      if (err) return cb(err);
      _.extend(seed.hub, hubSeed);
      cb(null, seed);
    });
  }

  var loadLocalStoreSeeds = util.async.each({
    // before: function(seed) { console.log("Loading local store seeds for", seedName); },
    selector: function(seed) { return seed.localFiles; },
    iterator: function(resourceName, idx, seed, cb) {
      if (!resourceName) return cb(null, seed);
      var location = [seedsDir, resourceName].join('/');
//      console.log("loading local store seed file from", location);

      util.getJSON(location, function(err, storeSeed) {
        if (err) return cb(err);
        _.extend(seed.local, storeSeed);
        cb(null, seed);
      });
    }
  });

  var loadRemoteStoreSeeds = util.async.each({
    // before: function(seed) { console.log("Loading remote store seeds for", seedName); },
    selector: function(seed) { return seed.remoteFiles; },
    iterator: function(resourceName, idx, seed, cb) {
      if (!resourceName) return cb(null, seed);
      var location = [seedsDir, resourceName].join('/');
//      console.log("loading remote store seed file from", location);

      util.getJSON(location, function(err, storeSeed) {
        if (err) return cb(err);
        _.extend(seed.remote, storeSeed);
        cb(null, seed);
      });
    }
  });

  util.async([loadRequiredSeeds, loadHubSeed, loadLocalStoreSeeds, loadRemoteStoreSeeds], seedSpec, cb);
};


if (typeof exports !== 'undefined') {
  module.exports = util;
} else {
  if (!ctx.Substance) ctx.Substance = {};
  if (!ctx.Substance.util) ctx.Substance.util = {};
  _.extend(ctx.Substance.util, util);
}

})(this);
