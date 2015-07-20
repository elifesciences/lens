
var Document = require('substance-document');

// Lens.Video
// -----------------
//

var Video = function(node, doc) {
  Document.Node.call(this, node, doc);
};

// Type definition
// -----------------
//

Video.type = {
  "id": "video",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "url": "string",
    "url_webm": "string",
    "url_ogv": "string",
    "caption": "caption",
    "poster": "string"
  }
};

Video.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Video.description = {
  "name": "Video",
  "remarks": [
    "A video type intended to refer to video resources.",
    "MP4, WebM and OGV formats are supported."
  ],
  "properties": {
    "label": "Label shown in the resource header.",
    "url": "URL to mp4 version of the video.",
    "url_webm": "URL to WebM version of the video.",
    "url_ogv": "URL to OGV version of the video.",
    "poster": "Video poster image.",
    "caption": "References a caption node, that has all the content"
  }
};

// Example Video
// -----------------
//

Video.example = {
  "id": "video_1",
  "type": "video",
  "label": "Video 1.",
  "url": "http://cdn.elifesciences.org/video/eLifeLensIntro2.mp4",
  "url_webm": "http://cdn.elifesciences.org/video/eLifeLensIntro2.webm",
  "url_ogv": "http://cdn.elifesciences.org/video/eLifeLensIntro2.ogv",
  "poster": "http://cdn.elifesciences.org/video/eLifeLensIntro2.png",
  // "doi": "http://dx.doi.org/10.7554/Fake.doi.003",
  "caption": "caption_25"
};

Video.Prototype = function() {

  this.getHeader = function() {
    return this.properties.label;
  };

  this.getCaption = function() {
    // HACK: this is not yet a real solution
    if (this.properties.caption) {
      return this.document.get(this.properties.caption);
    } else {
      return "";
    }
  };

};

Video.Prototype.prototype = Document.Node.prototype;
Video.prototype = new Video.Prototype();
Video.prototype.constructor = Video;

Document.Node.defineProperties(Video);

module.exports = Video;
