var LensNodes = require("lens/article/nodes");
var articleUtil = require("lens/article/article_util");
var CoverView = LensNodes["cover"].View;
var $$ = require("lens/substance/application").$$;
var _ = require("underscore");

var AMSCoverView = function(node, viewFactory) {
  CoverView.call(this, node, viewFactory);
};

var LABELS = {
  "amsrefs": "AMSRefs",
  "bibtex": "BibTeX"
};

AMSCoverView.Prototype = function() {
  this.render = function() {
    CoverView.prototype.render.call(this);

    var refUrl = encodeURIComponent(window.location.href);
    var pubInfo = this.node.document.get('publication_info');


    // Add cover data
    var journalinfoEl = $$('.journalinfo', {
          children: [
            $$('.journalinfo-img', {
              html: '<img src="images/ams-cover.png" alt="Journal Cover" />' 
            }),
            $$('.journalinfo-oa', {
              html: '<img src="images/ams-oa.png" alt="This article is open access" />' 
            }),
            $$('.journalinfo-share', {
              children: [
                $$('a.share', {
                  href: '#',
                  //target: "_blank",
                  html: '<img src="images/ams-share.png" alt="Share" />' 
                }),
                $$('a.remote-access', {
                  href: '#',
                  //target: "_blank",
                  html: '<img src="images/ams-remote-access.png" alt="Remote Access" />'
                })
              ]
            })
          ]
    });

    // Prepend journalinfo
    this.content.insertBefore(journalinfoEl, this.content.firstChild);

    var rawFormatsEl = $$('.raw-formats', {html: ""});
    _.each(pubInfo.raw_formats, function(rawFormat) {
      var type = rawFormat.type;
      var formatEl = $$('a.raw-format.'+type, {
        href: "data:text/plain;charset=UTF-8,"+encodeURIComponent(rawFormat.content),
        target: "_blank",
        "data-type": type,
        html: '<i class="fa fa-file-text-o"></i> '+LABELS[type],
      });
      rawFormatsEl.appendChild(formatEl);
    }, this);

    // Append
    this.content.appendChild(rawFormatsEl);
    
    return this;
  }
};

AMSCoverView.Prototype.prototype = CoverView.prototype;
AMSCoverView.prototype = new AMSCoverView.Prototype();
AMSCoverView.prototype.constructor = AMSCoverView;

module.exports = AMSCoverView;
