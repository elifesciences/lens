# Lens

```
########################################################################################
##### Disclaimer:
#####
##### You are looking at the 0.2.x series of Lens which is considered a work-in-progress
##### 
##### Use at your own risk! For a stable version check the `gh-pages` branch.
########################################################################################
```

**eLife Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers. For example, have you tried to look at a figure in an online article, while at the same time trying to see what the author says about the figure, jumping all around the article, losing track of what you were looking for in the first place? The reason for this is that most online research articles are published in a fixed digital version of the original paper. With eLife Lens, we take full advantage of the internet’s flexibility.

For a demo and more information see: http://lens.elifesciences.org

Lens is composed of some independent modules. Those are:

- The [Lens Article Format](http://github.com/elifesciences/lens-article) is a JSON based document model designed for representing scientific content. It features basic content types such as paragraphs, headings, and various figure types such as images, tables and videos complete with captions and cross-references.
- The [Lens Reader](http://github.com/elifesciences/lens-reader) is the implementation of the article reader, it can be embedded into any page
- The [Lens Outline](http://github.com/elifesciences/lens-outline) is the visual document map we are using in Lens. It can be used independently.



### Installing and contributing

For install instructions and how to contribute see the manual [here](https://github.com/elifesciences/lens-manual/blob/master/manual.md). 


<!--### Forking

To contribute to Lens you should clone the full Lens project first.

Then you can create your personal fork of the module you want contribute to:
see [here](https://help.github.com/articles/fork-a-repo) for explanations.

After that you should adapt the `project.json` to use your personal fork. E.g.,

```json
{
  "modules": [
    ...
    {
      "repository": "git@github.com:your_user/lens-article.git",
      "folder": "node_modules/lens-article",
      "branch": "my_feature"
    },
    ...
  ]
}
```
-->

<!--
#### Work with feature branches

A good start is working with fresh feature branches.

1. Create a feature branch across all sub-modules.

   ```bash
   $ substance --git -- checkout -b <feature_branch_name>
   ```

2. Edit `project.json` manually (replace branch: master with your feature-branch-name)

3. Checkout configured branches of sub-modules
 
   ```bash
   $ substance --checkout
   ```
-->



### Roadmap

The Roadmap is covered on the [project wiki](https://github.com/elifesciences/lens/wiki/Product-Roadmap)

