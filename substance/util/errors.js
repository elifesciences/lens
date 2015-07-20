"use strict";

var util = require('./util');

var errors = {};

// The base class for Substance Errors
// -------
// We have been not so happy with the native error as it is really poor with respect to
// stack information and presentation.
// This implementation has a more usable stack trace which is rendered using `err.printStacktrace()`.
// Moreover, it provides error codes and error chaining.
var SubstanceError = function(message, rootError) {

  // If a root error is given try to take over as much information as possible
  if (rootError) {
    Error.call(this, message, rootError.fileName, rootError.lineNumber);

    if (rootError instanceof SubstanceError) {
      this.__stack = rootError.__stack;
    } else if (rootError.stack) {
      this.__stack = util.parseStackTrace(rootError);
    } else {
      this.__stack = util.callstack(1);
    }

  }

  // otherwise create a new stacktrace
  else {
    Error.call(this, message);
    this.__stack = util.callstack(1);
  }

  this.message = message;
};

SubstanceError.Prototype = function() {

  this.name = "SubstanceError";
  this.code = -1;

  this.toString = function() {
    return this.name+":"+this.message;
  };

  this.toJSON = function() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack
    };
  };

  this.printStackTrace = function() {
    util.printStackTrace(this);
  };
};

SubstanceError.Prototype.prototype = Error.prototype;
SubstanceError.prototype = new SubstanceError.Prototype();

Object.defineProperty(SubstanceError.prototype, "stack", {
  get: function() {
    var str = [];
    for (var idx = 0; idx < this.__stack.length; idx++) {
      var s = this.__stack[idx];
      str.push(s.file+":"+s.line+":"+s.col+" ("+s.func+")");
    }
    return str.join("\n");
  },
  set: function() { throw new Error("SubstanceError.stack is read-only."); }
});

errors.SubstanceError = SubstanceError;


var createSubstanceErrorSubclass = function(parent, name, code) {
  return function(message) {
    parent.call(this, message);
    this.name = name;
    this.code = code;
  };
};

errors.define = function(className, code, parent) {
  if (!className) throw new SubstanceError("Name is required.");
  if (code === undefined) code = -1;

  parent = parent || SubstanceError;
  var ErrorClass = createSubstanceErrorSubclass(parent, className, code);
  var ErrorClassPrototype = function() {};
  ErrorClassPrototype.prototype = parent.prototype;
  ErrorClass.prototype = new ErrorClassPrototype();
  ErrorClass.prototype.constructor = ErrorClass;

  errors[className] = ErrorClass;
  return ErrorClass;
};

module.exports = errors;
