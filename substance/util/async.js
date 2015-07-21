"use strict";

var _ = require("underscore");
var util = require("./util.js");

// Helpers for Asynchronous Control Flow
// --------

var async = {};

function callAsynchronousChain(options, cb) {
  var _finally = options["finally"] || function(err, data) { cb(err, data); };
  _finally = _.once(_finally);
  var data = options.data || {};
  var functions = options.functions;

  if (!_.isFunction(cb)) {
    return cb("Illegal arguments: a callback function must be provided");
  }

  var index = 0;
  var stopOnError = (options.stopOnError===undefined) ? true : options.stopOnError;
  var errors = [];

  function process(data) {
    var func = functions[index];

    // stop if no function is left
    if (!func) {
      if (errors.length > 0) {
        return _finally(new Error("Multiple errors occurred.", data));
      } else {
        return _finally(null, data);
      }
    }

    // A function that is used as call back for each function
    // which does the progression in the chain via recursion.
    // On errors the given callback will be called and recursion is stopped.
    var recursiveCallback = _.once(function(err, data) {
      // stop on error
      if (err) {
        if (stopOnError) {
          return _finally(err, null);
        } else {
          errors.push(err);
        }
      }

      index += 1;
      process(data);
    });

    // catch exceptions and propagat
    try {
      if (func.length === 0) {
        func();
        recursiveCallback(null, data);
      }
      else if (func.length === 1) {
        func(recursiveCallback);
      }
      else {
        func(data, recursiveCallback);
      }
    } catch (err) {
      console.log("util.async caught error:", err);
      util.printStackTrace(err);
      _finally(err);
    }
  }

  // start processing
  process(data);
}

// Calls a given list of asynchronous functions sequentially
// -------------------
// options:
//    functions:  an array of functions of the form f(data,cb)
//    data:       data provided to the first function; optional
//    finally:    a function that will always be called at the end, also on errors; optional

async.sequential = function(options, cb) {
  // allow to call this with an array of functions instead of options
  if(_.isArray(options)) {
    options = { functions: options };
  }
  callAsynchronousChain(options, cb);
};

function asynchronousIterator(options) {
  return function(data, cb) {
    // retrieve items via selector if a selector function is given
    var items = options.selector ? options.selector(data) : options.items;
    var _finally = options["finally"] || function(err, data) { cb(err, data); };
    _finally = _.once(_finally);

    // don't do nothing if no items are given
    if (!items) {
      return _finally(null, data);
    }

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
    var chainOptions = {
      functions: funcs,
      data: data,
      finally: _finally,
      stopOnError: options.stopOnError
    };
    callAsynchronousChain(chainOptions, cb);
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

// TODO: support only one version and add another function
async.iterator = function(options_or_items, iterator) {
  var options;
  if (arguments.length == 1) {
    options = options_or_items;
  } else {
    options = {
      items: options_or_items,
      iterator: iterator
    };
  }
  return asynchronousIterator(options);
};

async.each = function(options, cb) {
  // create the iterator and call instantly
  var f = asynchronousIterator(options);
  f(null, cb);
};

module.exports = async;
