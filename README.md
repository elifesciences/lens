# Lens

**eLife Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers. For example, have you tried to look at a figure in an online article, while at the same time trying to see what the author says about the figure, jumping all around the article, losing track of what you were looking for in the first place? The reason for this is that most online research articles are published in a fixed digital version of the original paper. With eLife Lens, we take full advantage of the internet’s flexibility.

For a demo and more information see: http://lens.substance.io

Lens is composed of some independent modules. Those are:

- The [Lens Article Format](http://github.com/elifesciences/lens-article) is a JSON based document model designed for representing scientific content. It features basic content types such as paragraphs, headings, and various figure types such as images, tables and videos complete with captions and cross-references.
- The [Lens Reader](http://github.com/elifesciences/lens-reader) is the implementation of the article reader, it can be embedded into any page
- The [Lens Outline](http://github.com/elifesciences/lens-outline) is the visual document map we are using in Lens. It can be used independently.

### Installing and contributing

For install instructions and how to contribute see the official [Lens Manual](http://lens.substance.io/#lens/manual). 

### Journal integration

The easiest way to integrate Lens into your journal is by creating one HTML file per document and adapt the url to the document you want to display. 

    var app = new Lens({
      // Endpoint must have CORS enabled, or file is served from the same domain as the app
      document_url: "https://s3.amazonaws.com/elife-cdn/elife-articles/00778/elife00778.xml"
    });

Keep in mind, with eLife Lens you can display any NLM-compatible XML file or JSON documents that correspond to the Lens Article Format. You can enrich your HTML file with `<meta>` tags etc. to ensure Google crawlablility. There is no server infrastructure needed to run Lens. It's 100% browser-based. If you have questions please consult the [Lens Mailinglist](https://groups.google.com/forum/#!forum/elife-lens).

### Roadmap

The Roadmap is covered on the [project wiki](https://github.com/elifesciences/lens/wiki/Product-Roadmap)


### Lens in the wild

- [eLife Journal](http://lens.elifesciences.org/01120/index.html)
- [Landes Bioscience](https://www.landesbioscience.com/article/25414/full_text/#load/info/all)
- [PeerJ Lens Demo](http://peerj.github.io/lens-demo/)

### Changelog

### 0.3.0

- Support for mobile devices
- No reload on route navigation (makes navigating back/forward much faster)
- Improved scrollbar mouse interaction (dragging outside the document outline is now possible)