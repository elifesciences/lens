// Render Underscore templates
_.tpl = function(tpl, ctx) {
  source = $("script[name="+tpl+"]").html();
  return _.template(source, ctx);
};


_.htmlId = function(node) {
  node = _.isObject(node) ? node.id : node;
  var res = node.split(':').join('_');
  return res.split('/').join('_');
};

_.nodeId = function(htmlId) {
  return htmlId.replace('node_', '').replace('_', ':');
};

// Color Pool
// --------------

// A Color Pool maintains arbitrary color palettes
// and assigns them in round robin style.

var ColorPool = function(colors) {
  var keys = _.keys(colors);
  var paletteIndex = 0;
  var palettes = {};
  
  // Initialize color indexes
  _.each(colors, function(c, key, index) {
    palettes[key] = {
      paletteIndex: index,
      colorIndex: 0,
      colors: c
    };
  });
  
  // Get a new color, either from a given group or the just the next available
  function getNext(paletteKey) {
    if (paletteKey) {
      var palette = palettes[paletteKey];
      var color = palette.colors[palette.colorIndex];
      palette.colorIndex = (palette.colorIndex+1) % palette.colors.length;
    } else {
      var palette = palettes[keys[paletteIndex]];
      var color = palette.colors[palette.colorIndex];
      palette.colorIndex = (palette.colorIndex+1) % palette.colors.length;
      paletteIndex = (paletteIndex+1) % keys.length;
    }
    return color;
  }
  
  function reset() {
    _.each(palettes, function(palette, key) {
      palette.colorIndex = 0;
    });
    paletteIndex = 0;
  }
  
  return {
    getNext: getNext,
    reset: reset
  }
};


// Get headings for doc
// ------------------

var getHeadings = function(doc) {
  return _.filter(doc.find('headings'), function(h) {
    return _.contains(doc.views.content, h.id);
  });
}
