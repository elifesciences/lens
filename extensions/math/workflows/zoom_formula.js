var _ = require('underscore');
var Lens = require('../../../reader');
var Workflow = Lens.Workflow;

var ZoomFormula = function() {
  Workflow.call(this);

  this.formulaWidths = {};
  this.formulaHeights = {};
  this.formulaIsZoomed = {};

  this._handleFormulasChange = function() {
    this.fitFormulas();
  }.bind(this);

};

ZoomFormula.Prototype = function() {

  this.registerHandlers = function() {
    var self = this;

    // Listen for clicks on formulas to toggle scale/scroll
    // ------------------
    //
    // this way to handle the event is a hack! lens/substance infrastructure should be used here!

    $(this.readerView.$el).on("click",".formula .content .MathJax_Display.zoomable",
      function(e) { self.toggleFormulaScaling(e,this); }
    );

    // Attach a lazy/debounced handler for resize events
    // ------------------
    //

    $(window).resize(_.debounce(_.bind(function() {
      this.fitFormulas();
    }, this), 1));

    // Recompute zoom factors after MathJax has finished processing.
    // ------------------
    //

    var self = this;
    if (window.MathJax){
      MathJax.Hub.Register.MessageHook("End Process", function (message) {
        self.fitFormulas();
      });
    }

    this.readerView.doc.on('app:formulas:changed', this._handleFormulasChange);
  };

  this.unRegisterHandlers = function() {
    $(this.readerView.$el).off("click",".formula .content .MathJax_Display");
    this.readerView.doc.off('app:formulas:changed', this._handleFormulasChange);
  };

  this.fitFormula = function(nodeId,formulaNode) {
    var mathjaxContainer = $(formulaNode).find('.MathJax_Display')[0];
    var mathEl = $(formulaNode).find('.math')[0];
    if (!mathEl) return;

    if(this.getFormulaIsZoomed(nodeId)) { // Zoomed

      mathEl.style["-webkit-transform-origin"] = "";
      mathEl.style["-moz-transform-origin"] = "";
      mathEl.style["-ms-transform-origin"] = "";
      mathEl.style.transformOrigin = "";
      mathEl.style["-webkit-transform"] = "";
      mathEl.style["-moz-transform"] = "";
      mathEl.style["-ms-transform"] = "";
      mathEl.style.transform = "";

      mathjaxContainer.style.height = "";
      mathjaxContainer.style.overflowX = "auto";

    } else { // Scaled
      var containerWidth = $(mathjaxContainer).width();
      var INDENT = 3.0;
      var style;

      if (!this.formulaWidths[nodeId]) {
        var spanElement = $(mathjaxContainer).find(".math")[0];
        if (spanElement) {
          style = window.getComputedStyle(spanElement);
          this.formulaWidths[nodeId] = parseFloat(style.fontSize) * (spanElement.bbox.w + INDENT);
        }
      }

      if (!this.formulaHeights[nodeId]) {
        style = window.getComputedStyle(mathjaxContainer);
        this.formulaHeights[nodeId] = parseFloat(style.height);
      }
      var CORRECTION_FACTOR = 0.92;
      var ratio = Math.min(containerWidth / this.formulaWidths[nodeId]*CORRECTION_FACTOR,1.0);
      // mathEl.style.cursor = (ratio < 0.9 ? "zoom-in" : ""); //simple zoom UI
      if (ratio < 0.9) {
        mathjaxContainer.classList.add("zoomable");
      } else {
        mathjaxContainer.classList.remove("zoomable");
      }

      mathEl.style["-webkit-transform-origin"] = "top left";
      mathEl.style["-moz-transform-origin"] = "top left";
      mathEl.style["-ms-transform-origin"] = "top left";
      mathEl.style.transformOrigin = "top left";
      mathEl.style["-webkit-transform"] = "scale("+ratio+")";
      mathEl.style["-moz-transform"] = "scale("+ratio+")";
      mathEl.style["-ms-transform"] = "scale("+ratio+")";
      mathEl.style.transform = "scale("+ratio+")";

      mathjaxContainer.style.height = "" + (this.formulaHeights[nodeId] * ratio) + "px";
      mathjaxContainer.style.overflowX = "visible";
    }
  };

  // Trigger fitting all formulas in the document
  // -----------------

  this.fitFormulas = function() {
    var self = this;

    $('.content-node.formula').each(function() {
      var nodeId = $(this).find('.MathJax_Display .MathJax').attr("id");
      self.fitFormula(nodeId,this);
    });
  };

  // these methods handle the toggling logic
  // -----------------

  this.getFormulaIsZoomed = function(nodeId) {
    if(this.formulaIsZoomed[nodeId] === undefined) {
      return false;
    } else {
      return this.formulaIsZoomed[nodeId];
    }
  };

  this.setFormulaIsZoomed = function(nodeId,value) {
    this.formulaIsZoomed[nodeId] = value;
  };

  this.toggleFormulaIsZoomed = function(nodeId) {
    this.setFormulaIsZoomed(nodeId, !this.getFormulaIsZoomed(nodeId));
  };

  this.toggleFormulaScaling = function(e, node) {
    // var nodeId = $(e.currentTarget).find('.MathJax').attr("id");
    var nodeId = $(node).find('.MathJax').attr("id");
    var formulaNode = $(node).parents('.content-node.formula')[0];
    this.toggleFormulaIsZoomed(nodeId);
    this.fitFormula(nodeId, formulaNode);
  };

};
ZoomFormula.Prototype.prototype = Workflow.prototype;
ZoomFormula.prototype = new ZoomFormula.Prototype();

module.exports = ZoomFormula;
