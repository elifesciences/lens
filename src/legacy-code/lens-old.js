(function(root) {

// Lens
// ========

var Lens = Backbone.View.extend({
  el: '#container',
  
  events: {
    'click a.hide-browser-warning': '_hideBrowserWarning'
  },

  initialize: function(options) {
    _.bindAll(this, 'document', 'list');
  },

  // Hide warming
  _hideBrowserWarning: function() {
    document.cookie =  'message_read=1; expires=Thu, 2 Aug 2050 20:47:11 UTC; path=/';
    document.location.reload();
    return false;
  },

  // Main view injection
  // --------
  // 
  // Replaces the current main view

  replaceMainView: function (name, view) {
    $('body').removeClass().addClass('current-view '+name);
    if (this.mainView) {
      this.mainView.remove();
    }

    this.mainView = view;
    this.$('#main').empty();
    $(view.el).appendTo(this.$('#main'));
  },

  // The List View
  // -------

  checkBrowser: function() {
    var b = BrowserDetect.browser;
    var v = BrowserDetect.version;

    if (document.cookie) return true;
    if (_.include(["Chrome", "Safari", "Firefox", "Opera"], b)) return true;
    if (b === "Explorer" && v >= 10) return true;

    // Display warning
    $('.browser-not-supported').show();
    $('#main').hide();
    return false;
  },

  // The List View
  // -------

  list: function() {
    if (!this.checkBrowser()) return;
    var that = this;

    $('#main').empty();
    $('#container .loading').show().html('Fetching Articles ...');

    session.loadDocumentList(function(err, kenSession) {
      $('#container .loading').hide();

      document.title = "eLife Lens - A novel way of seeing content";
      that.replaceMainView("browser", new Ken.Browser({model: kenSession, id: 'browser'}).render());
    });
  },

  // The Document View
  // -------

  document: function(d, t, n, r) {
    if (!this.checkBrowser()) return;
    var that = this;

    $('#main').empty();
    $('#container .loading').show().html('Loading Article ...');
    
    var docId = d || "e00170";

    function getResourceType(t) {
      if (t === 'publications') t = 'publication';
      if (t === 'figures') t = 'figure';
      return t || 'toc';
    }

    var resourceType = getResourceType(t);
    var node = null;
    var resource = null;
    
    if (!r) {
      if (t) {
        node = n ? n.replace(/_/g, ':') : null;
      } else {
        resource = n ? n.replace(/_/g, ':') : null;  
      }
    } else {
      node = n ? n.replace(/_/g, ':') : null;
      resource = r ? r.replace(/_/g, ':') : null;
    }

    session.loadDocument(docId, function(err, doc) {
      that.replaceMainView("content", new Lens.Document({
        model: {
          id: docId,
          document: doc,
          node: node,
          resourceType: resourceType,
          resource: resource
        },
        id: 'document'
      }).render());

      // Set document title
      document.title = doc.properties.title;
    });
    return false;
  },

  // Render Application
  // --------

  render: function() {
    return this;
  }
});


// The Router
// -----------------

Lens.Router = Backbone.Router.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(":document/:type/:node/:resource", 'resource', app.document);
    this.route(":document/:type/:node", 'resource', app.document);
    this.route(":document/:type", 'resource', app.document);
    this.route(":document", 'resource', app.document);
    this.route("", "start", app.list);
  }
});

// Expose
root.Lens = Lens;

})(this);