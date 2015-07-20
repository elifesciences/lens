"use strict";

var _ = require("underscore");
var $$ = require("substance-application").$$;
var NodeView = require("../node").View;
var ResourceView = require('../../resource_view');


// Lens.Video.View
// ==========================================================================

var VideoView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};



VideoView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  this.renderBody = function() {

    // Enrich with video content
    // --------
    //

    var node = this.node;

    // The actual video
    // --------
    //

    var sources = [
      $$('source', {
        src: node.url,
        type: "video/mp4; codecs=&quot;avc1.42E01E, mp4a.40.2&quot;",
      })
    ];

    if (node.url_ogv) {
      sources.push($$('source', {
        src: node.url_ogv,
        type: "video/ogg; codecs=&quot;theora, vorbis&quot;",
      }));
    }

    if (node.url_webm) {
      sources.push($$('source', {
        src: node.url_webm,
        type: "video/webm"
      }));
    }

    var video = $$('.video-wrapper', {
      children: [
        $$('video', {
          controls: "controls",
          poster: node.poster,
          preload: "none",
          // style: "background-color: black",
          children: sources
        })
      ]
    });

    this.content.appendChild(video);

    // The video title
    // --------
    //

    if (node.title) {
      this.content.appendChild($$('.title', {
        text: node.title
      }));
    }

    // Add caption if there is any
    if (this.node.caption) {
      var caption = this.createView(this.node.caption);
      this.content.appendChild(caption.render().el);
      this.captionView = caption;
    }

    // Add DOI link if available
    // --------
    //

    if (node.doi) {
      this.content.appendChild($$('.doi', {
        children: [
          $$('b', {text: "DOI: "}),
          $$('a', {href: node.doi, target: "_new", text: node.doi})
        ]
      }));
    }
  };

};

VideoView.Prototype.prototype = NodeView.prototype;
VideoView.prototype = new VideoView.Prototype();

module.exports = VideoView;
