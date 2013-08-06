# Lens

**eLife Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers. For example, have you tried to look at a figure in an online article, while at the same time trying to see what the author says about the figure, jumping all around the article, losing track of what you were looking for in the first place? The reason for this is that most online research articles are published in a fixed digital version of the original paper. With eLife Lens, we take full advantage of the internet’s flexibility.

For a demo and more information see: http://lens.elifesciences.org



### Participating and Contributing 

Participation is highly encouraged. 

To suggest a feature, report a bug: http://github.com/elifesciences/lens/issues/

For general discussion join the mailing list/web forum: https://groups.google.com/forum/#!forum/elife-lens

To get an overview of what we are currently working on now, and to see what we would like to work on in the future have a look at our roadmap: https://github.com/elifesciences/lens/wiki/Product-Roadmap

To contribute to the project, please fork the project, and submit your pull requests. We will code review submissions, and a track record of good submissions will build confidence, and gain you access to direct access to the repo.

The core team meets on a google+ hangout regularly. If you would like to join the core team, please consider supporting the project through either 
code contributions, or a finanial commitment to support development. 

### The Lens Article Format

The [Lens Article Format](http://github.com/elifesciences/lens-article) is a JSON based document model designed for representing scientific content. It features basic content types such as paragraphs, headings, and various figure types such as images, tables and videos complete with captions and cross-references.

We're working on releasing the first official verison of the spec.

### Install

Installing and running Lens locally is quite simple, since all you need is Node.js (our dev environment) and a web-browser.


1. Clone the repository

   ```bash
   $ git clone https://github.com/elifesciences/lens.git
   ```
  
2. Run the lens script, which pulls in all the dependencies

   ```bash
   $ cd lens
   $ substance --update
   ```
  
3. Finally start the server and point your browser to `http://localhost:4000`

   ```bash
   $ substance --start
   ```


### Development workflow

1. Create a feature branch across all sub-modules.

   ```bash
   substance --git -- checkout -b <feature_branch_name>
   ```

2. Edit `project.json` manually (replace branch: master with your feature-branch-name)

3. substance --checkout

### Deployment

This is not yet implemented, but in a couple of weeks you'll be able to bundle Lens as a static web page as simple as this.

```bash
$ substance --bundle
```

It creates a `dist` folder with everything you need.


### Roadmap

The Roadmap is covered on the [project wiki](https://github.com/elifesciences/lens/wiki/Product-Roadmap)

