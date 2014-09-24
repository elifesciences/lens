
var KeyReferenceExtension = function(citationView, keyRefRelationship) {
  this.citationView = citationView;
  this.keyRefRelationship = keyRefRelationship;
};

KeyReferenceExtension.Prototype = function() {

  this.render = function() {
    var $keyRefEl = this.citationView.$el.find('.key-reference');
    if ($keyRefEl.length === 0) {
      $keyRefEl = $('<div>').addClass('key-reference');
      this.citationView.$el.append($keyRefEl);
    }

    $keyRefEl.empty();

    var $descrEl = $('<div>').addClass('.description');
    $descrEl.text(this.keyRefRelationship.description);
    $keyRefEl.append($descrEl);
  };

};

KeyReferenceExtension.prototype = new KeyReferenceExtension.Prototype();

module.exports = KeyReferenceExtension;
