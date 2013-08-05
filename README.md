# Lens

**eLife Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers. For example, have you tried to look at a figure in an online article, while at the same time trying to see what the author says about the figure, jumping all around the article, losing track of what you were looking for in the first place? The reason for this is that most online research articles are published in a fixed digital version of the original paper. With eLife Lens, we take full advantage of the internet’s flexibility.

For a demo and more information see: http://lens.elifesciences.org

To suggest a feature, report a bug, or general discussion: http://github.com/elifesciences/lens/issues/

## Install

Installing and running Lens locally is quite simple, since all you need is Node.js (our dev environment) and a web-browser.


1. Clone the repository

   ```bash
   $ git clone https://github.com/elifesciences/lens.git
   ```
  
2. Run the lens script, which pulls in all the dependencies

   ```bash
   $ cd lens
   $ ./lens update
   ```
  
3. Finally start the server and point your browser to `http://localhost:4000`

   ```bash
   $ ./lens start
   ```

## Deployment

This is not yet implemented, but in a couple of weeks you'll be able to bundle Lens as a static web page as simple as this.

```bash
$ ./lens bundle
```

It creates a `dist` folder with everything you need.


## Roadmap

Lens is a work in progress. It's intended to be an open platform for viewing science literature.  Here's what you can expect to be implemented in the coming months.

- Integrating other OA content (first will be [PLoS](http://www.plos.org))
- Private notes, so users can stick notes on their paper which are stored locally
- Mobile optimizations
- Evaluating options for offline reading
- And obviously there will be bugfixes, UI polish addressing the feedback we've got
