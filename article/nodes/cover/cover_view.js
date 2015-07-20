"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("substance-application").$$;
var articleUtil = require("../../article_util");

// Lens.Cover.View
// ==========================================================================

var CoverView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

CoverView.Prototype = function() {

  // Render it
  // --------
  //
  // .content
  //   video
  //     source
  //   .title
  //   .caption
  //   .doi

  this.render = function() {
    NodeView.prototype.render.call(this);

    var node = this.node;
    var pubInfo = this.node.document.get('publication_info');

    if (node.breadcrumbs && node.breadcrumbs.length > 0) {
      var breadcrumbs = $$('.breadcrumbs', {
        children: _.map(node.breadcrumbs, function(bc) {
          var html;
          if (bc.image) {
            html = '<img src="'+bc.image+'" title="'+bc.name+'"/>';
          } else {
            html = bc.name;
          }
          return $$('a', {href: bc.url, html: html});
        })
      });
      this.content.appendChild(breadcrumbs);
    }


    if (pubInfo) {
      var pubDate = pubInfo.published_on;
      if (pubDate) {
        var items = [articleUtil.formatDate(pubDate)];
        if (pubInfo.journal && !node.breadcrumbs) {
          items.push(' in <i>'+pubInfo.journal+'</i>');
        }

        this.content.appendChild($$('.published-on', {
          html: items.join('')
        }));
      }
    }

    // Title View
    // --------------
    //

    var titleView = this.createTextPropertyView(['document', 'title'], { classes: 'title', elementType: 'div' });
    this.content.appendChild(titleView.render().el);

    // Render Authors
    // --------------
    //

    var authors = $$('.authors', {
      children: _.map(node.getAuthors(), function(authorPara) {
        var paraView = this.viewFactory.createView(authorPara);
        var paraEl = paraView.render().el;
        this.content.appendChild(paraEl);
        return paraEl;
      }, this)
    });

    authors.appendChild($$('.content-node.text.plain', {
      children: [
        $$('.content', {text: this.node.document.on_behalf_of})
      ]
    }));

    this.content.appendChild(authors);

    // Render Links
    // --------------
    //

    if (pubInfo && pubInfo.links.length > 0) {
      var linksEl = $$('.links');
      _.each(pubInfo.links, function(link) {
        if (link.type === "json" && link.url === "") {
          // Make downloadable JSON
          var json = JSON.stringify(this.node.document.toJSON(), null, '  ');
          var bb = new Blob([json], {type: "application/json"});

          linksEl.appendChild($$('a.json', {
            href: window.URL ? window.URL.createObjectURL(bb) : "#",
            html: '<i class="fa fa-external-link-square"></i> '+link.name,
            target: '_blank'
          }));

        } else {
          linksEl.appendChild($$('a.'+link.type, {
            href: link.url,
            html: '<i class="fa fa-external-link-square"></i> '+ link.name,
            target: '_blank'
          }));
        }
      }, this);

      this.content.appendChild(linksEl);
    }

    if (pubInfo) {
      var doi = pubInfo.doi;
      if (doi) {
        this.content.appendChild($$('.doi', {
          html: 'DOI: <a href="http://dx.doi.org/'+doi+'">'+doi+'</a>'
        }));
      }
    }

    return this;
  };
};

CoverView.Prototype.prototype = NodeView.prototype;
CoverView.prototype = new CoverView.Prototype();

module.exports = CoverView;
