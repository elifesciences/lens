"use strict";

var _ = require('underscore');
var Workflow = require('./workflow');

var JumpToTop = function() {
  Workflow.apply(this, arguments);
  this._gotoTop = _.bind(this.gotoTop, this);
};


JumpToTop.Prototype = function() {

  this.registerHandlers = function() {
    this.readerView.$el.on('click', '.document .content-node.heading .top', this._gotoTop);
  };

  this.unRegisterHandlers = function() {
    this.readerView.$el.off('click', '.document .content-node.heading .top', this._gotoTop);
  };

  this.gotoTop = function() {
    e.preventDefault();
    e.stopPropagation();
    // Jump to cover node as that's easiest
    this.readerCtrl.contentView.jumpToNode("cover");
  };
};

JumpToTop.Prototype.prototype = Workflow.prototype;
JumpToTop.prototype = new JumpToTop.Prototype();

module.exports = JumpToTop;
