
var Panel = function() {
  this.view = null;
};

Panel.Prototype = function() {

  this.getView = function() {
    return this.view;
  };

};

Panel.prototype = new Panel.Prototype();
Panel.prototype.constructor = Panel;

module.exports = Panel;
