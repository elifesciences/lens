"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;
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


    // Render Subject(s) if available
    // --------------
    //

    if (pubInfo) {
      var subjects = pubInfo.subjects;
      if (subjects) {
        var subjectsEl
        if (pubInfo.subject_link) {
          subjectsEl = $$('.subjects', {
            children: _.map(pubInfo.getSubjectLinks(), function(subject) {
              return $$('a', {href: subject.url, text: subject.name})
            })
          })

        } else {
          subjectsEl = $$('.subjects', {
            html: subjects.join(' ')
          })
        }
        this.content.appendChild(subjectsEl);
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

    if (pubInfo) {
      var pubDate = pubInfo.published_on;
      var articleType = pubInfo.article_type;
      if (pubDate) {
        var items = [articleUtil.formatDate(pubDate)];

        if (articleType) {
          if (pubInfo.article_type_link) {
            var linkData = pubInfo.getArticleTypeLink()
            items.unshift('<a href="'+linkData.url+'">'+linkData.name+'</a>')
          } else {
            items.unshift(articleType)
          }
          
        }

        this.content.appendChild($$('.published-on', {
          html: items.join(' ')
        }));
      }
    }

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
