// Global event handlers, to be called by jQuery
// There's no better way for now

var handleDoc;
var handleDocList;

(function(root) {

// Lens.Session
// ========
// 
// The main controller that takes over all the logic needed by the client

var Session = function() {

  // Turn the raw JSON into an instance of Substance.Document
  // --------
  // 

  function convert(eLifeDoc) {
    var doc = new Substance.Document({id: "new-doc"}, Lens.SCHEMA);

    function insert(nodeId, view) {
      if (doc.nodes[nodeId]) return; // skip existing nodes
      var node = eLifeDoc.nodes[nodeId];
      var data = JSON.parse(JSON.stringify(node));

      delete data.id;
      delete data.type;

      var op = [
        "insert", 
        {
          "id": node.id,
          "type": node.type,
          "target": view ? [view, "back"] : null,
          "data": data
        }
      ];
      doc.apply(op);
    }

    // Pull in content nodes
    _.each(eLifeDoc.views.content, function(nodeId) {
      if (!nodeId) return;
      insert(nodeId, "content");
    });

    // Pull in publications
    _.each(eLifeDoc.views.publications, function(nodeId) {
      if (!nodeId) return;
      insert(nodeId, "publications");
    });

    // Pull in figures
    _.each(eLifeDoc.views.figures, function(nodeId) {
      if (!nodeId) return;
      insert(nodeId, "figures");
    });

    // Pull in info nodes
    _.each(eLifeDoc.views.info, function(nodeId) {
      if (!nodeId) return;
      insert(nodeId, "info");
    });

    // Pull in other nodes
    _.each(eLifeDoc.nodes, function(node) {
      insert(node.id);
    });

    doc.properties = JSON.parse(JSON.stringify(eLifeDoc.properties));

    // For debugging
    window.doc = doc;
    return doc;
  }


  function url(id) {
    if (Lens.ENV === 'production') {
      return (id ? Lens.API_URL_PRODUCTION[0] + '/' + id
                : Lens.API_URL_PRODUCTION[0] + '/documents') + Lens.API_URL_PRODUCTION[1];
    } else {
      return id ? Lens.API_URL_DEV + '/documents/' +id
                : Lens.API_URL_DEV + '/documents';
    }
  }

  // Load static doc from data folder
  // --------
  // 
  // Used for about text / user manual /  developer guide

  function loadLocalDoc(id, cb) {
    $.ajax({
      type : "GET",
      dataType : "json",
      url : 'data/'+id+'.json',
      success: function(doc) {
        cb(null, convert(doc));
      }
    });
  }

  // Load Document List (Index)
  // --------
  // 
  // Relies on JSONP and expects an executable js file that calls handleDocList

  function loadDocument(id, cb) {
    if (id === "about") return loadLocalDoc(id, cb);

    // Overwrite global reference, so we can access cb
    handleDoc = function(elifeDoc) {
      var doc = convert(elifeDoc);
      cb(null, doc);
    };

    $.ajax({
      type : "GET",
      dataType : "jsonp",
      url : url(id),
      // jsonp: false, doesn't add ?callback=xy
      jsonpCallback: 'handleDoc',
    });
  }

  // Load Document List (Index)
  // --------
  // 
  // Relies on JSONP and expects an executable js file that calls handleDocList

  function loadDocumentList(cb) {
    // Overwrite global reference, so we can access cb
    handleDocList = function(data) {
      var collection = new Data.Collection(data);

      var session = new Ken.Session(collection);
      cb(null, session);

    };

    $.ajax({
      type : "GET",
      dataType : "jsonp",
      url : url(),
      // jsonp: false, doesn't add ?callback=xy
      jsonpCallback: 'handleDocList'
    });
  }

  // Expose public interface
  this.loadDocumentList = loadDocumentList;
  this.loadDocument = loadDocument;
}

// Export
root.Lens.Session = Session;
  
})(this);