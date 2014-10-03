This document explains how to setup a development environment.

# Prerequisites

## Substance Screwdriver

We use a custom Python tool to manage Git repositories.
We didn't opt for using Git sub-modules as it doesn't make it easier but rather even more complicated.

To install Substance ScrewDriver do

```
$ git clone https://github.com/substance/screwdriver.git
```

and install it globally

```
$ cd screwdriver
$ sudo python setup.py install
```

You need to repeat that install step whenever you pull in updates.

## Sublime 2 Integration

We use a custom Sublime plugin which adds a summary page to show all pending changes so that we do not forget to commit and push changes to some of the sub-modules.

MacOSX:

```
$ cd $HOME/Library/Application Support/Sublime Text 2/Packages
$ git clone https://github.com/substance/sublime.git Substance
```

Linux (Ubuntu):
```
$ cd ~/.config/sublime-text-2/Packages
$ git clone https://github.com/substance/sublime.git Substance
```

# Development Environment

Clone the Lens repository

```
$ git clone https://github.com/elifesciences/lens.git
```

and use the Screwdriver to pull in the dependencies

```
$ cd lens
$ substance --update
```

# Pull Requests

Unfortunately, this is still a bit inconvient as we have not yet connected the Screwdriver with the Github API.
There are some commands that may be helpful, though.

## Fork manually

Very likely, your contributions will affect only a few or even only one repository.
You should fork all necessary repositories within your Github account.

## Register your own repositories

As it doesn't hurt to register a non-existing remote, as long you are effectively pushing to it, it is the easiest way to just run this Screwdriver command:

```
$ substance --each -- git add remote mine https://github.com/<your-gh-id>/{{repoName}}
```
Note: `substance --each` executes what is given after `--` on the shell for each sub-module configured in `project.json`.

Make sure you choose your own Github id and maybe you want to go for different remote name.

## Push to your own fork

To push the current state to your repository you would

```
$ substance --push --remote=mine
```

Note: you can only push changes to repositories that you have forked before.

## Send Pull Request

The last step is to send a pull request from within Github.
