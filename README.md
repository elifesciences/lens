# Lens

**eLife Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers. For example, have you tried to look at a figure in an online article, while at the same time trying to see what the author says about the figure, jumping all around the article, losing track of what you were looking for in the first place? The reason for this is that most online research articles are published in a fixed digital version of the original paper. With eLife Lens, we take full advantage of the internet’s flexibility.

For a demo and more information see: http://lens.elifesciences.org

Lens is composed of some independent modules. Those are:

- The [Lens Article Format](http://github.com/elifesciences/lens-article) is a JSON based document model designed for representing scientific content. It features basic content types such as paragraphs, headings, and various figure types such as images, tables and videos complete with captions and cross-references.
- The [Substance Reader](http://github.com/substance/reader) is the implementation of the reading interface, it can be embedded into any page
- The [Lens Outline](http://github.com/elifesciences/lens-outline) is the visual document map we are using in Lens. It can be used independently.

### Getting started

The easiest way to integrate Lens into your website is by creating one HTML file per document and adapt the url to the document you want to display. First [download](https://lens.elifesciences.org/lens-1.0.0.zip) the latest stable Lens distribution. Then adjust the `index.html` file accordingly.

    var app = new Lens({
      // Endpoint must have CORS enabled, or file is served from the same domain as the app
      document_url: "https://s3.amazonaws.com/elife-cdn/elife-articles/00778/elife00778.xml"
    });

When running this Lens distribution locally, note that your browser may enforce strict permissions for reading files out of the local file system. You can solve this easily by running Python's built-in server:

    python -m SimpleHTTPServer

Keep in mind, with eLife Lens you can display any NLM-compatible XML file or JSON document that corresponds to the Lens Article Format. You can enrich your HTML file with `<meta>` tags etc. to ensure Google crawlablility. There is no server infrastructure needed to run Lens, as it's 100% browser-based. If you have questions please consult the [Lens Mailinglist](https://groups.google.com/forum/#!forum/elife-lens).


### Installing and contributing

For install instructions and how to contribute see the official [Lens Manual](http://substance.io/#substance/lens_manual). 


### Lens in the wild

- [eLife Journal](http://lens.elifesciences.org/01120/index.html)
- [Landes Bioscience](https://www.landesbioscience.com/article/25414/full_text/#load/info/all)
- [PeerJ Lens Demo](http://peerj.github.io/lens-demo/)


### Changelog


### 1.0.0

- Excluded `funder-id` from funding source name
- Properly handle multiple equal contribution groups
- Mark deceased contributor as "* Deceased"
- Fixed a Safari-related regression in the converter
- Added loading spinner using CSS3 animations.

### 1.0.0 RC2

- Include `suffix` element for contributor names
- Updated Manual and About document
- Mark `deceased` contributors
- Include ORCID on author cards
- Display members of a person group on the group's card
- Consider present address of a contributor
- Display reviewing editor
- Support for `<named-content>` elements
- Introduced deterministic URL resolver based on `xml:base` attribute
- Fixed display issues related to inline graphics
- Extract and display `<on-behalf-of>` element
- Support for author-callout-style (encoded as colors)
- Reusing visual outline for resources (figures, citations, info panel)
- Display publish date and DOI on cover node
- Improved display of competing interests (on author cards)
- Keywords in publication info are now italic.
- Included `<award-id>` in funding sources display
- Consider `<collab>` elements in citations
- Added another fallback for citation title extraction (`<source>`)


### 1.0.0 RC1

- Added TRIM_WHITESPACE option to converter
- Updated Manual and About document
- Link all documentation from http://lens.elifesciences.org
- Deal better with author groups
- Rename Person -> Contributor (consistent with JATS)
- Added jumpmarks for the mobile version


### 0.3.0

- Added support for mobile devices
- No reload on route navigation (makes navigating back/forward much faster)
- Improved scrollbar mouse interaction (dragging outside the document outline is now possible)
- Covered one million rendering edgecases
- Scrolling on body for mobile, fixes numerous scrolling issues related to mobile (esp. iOS)
- Space efficiency - use full available space
- display breadcrumbs for navigating back to the journal page
- Smaller font for title / authors in mobile version
- Fixed an issue related to scroll recovery on mobile
- Display publisher logo with breadcrumbs

### 0.2.0

- Modularization
- Introuced Lens Article format definition
- Style improvements
- Native support for NLM using a new browser-based converter

### 0.1.0

- Initial Lens release
