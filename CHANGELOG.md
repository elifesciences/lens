# Changelog

### 2.0.0

- Work in progress (checkout current master)

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

- Initial version