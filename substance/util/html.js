"use strict";

var html = {};
var _ = require("underscore");

html.templates = {};

// html.compileTemplate = function(tplName) {
//   var rawTemplate = $('script[name='+tplName+']').html();
//   html.templates[tplName] = Handlebars.compile(rawTemplate);
// };

html.renderTemplate = function(tplName, data) {
  return html.templates[tplName](data);
};

// Handlebars.registerHelper('ifelse', function(cond, textIf, textElse) {
//   textIf = Handlebars.Utils.escapeExpression(textIf);
//   textElse  = Handlebars.Utils.escapeExpression(textElse);
//   return new Handlebars.SafeString(cond ? textIf : textElse);
// });

if (typeof window !== "undefined") {
  // A fake console to calm down some browsers.
  if (!window.console) {
    window.console = {
      log: function() {
        // No-op
      }
    };
  }
}

// Render Underscore templates
html.tpl = function (tpl, ctx) {
  ctx = ctx || {};
  var source = window.$('script[name='+tpl+']').html();
  return _.template(source, ctx);
};

// Exports
// ====

module.exports = html;
