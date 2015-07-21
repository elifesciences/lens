"use strict";

var Application = require("./application");
Application.View = require("./view");
Application.Router = require("./router");
Application.Controller = require("./controller");
Application.ElementRenderer = require("./renderers/element_renderer");
Application.$$ = Application.ElementRenderer.$$;

module.exports = Application;
