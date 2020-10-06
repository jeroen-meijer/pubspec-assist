# <img style="float: left; width: 35px; padding: 0 10px 0 5px" src="https://github.com/jeroen-meijer/pubspec-assist/blob/e2dd62bfd744c6c41ed40870200903e04f5c91dd/images/logo_35.png?raw=true"> Pubspec Assist

## Easily add dependencies to your Dart / Flutter project.

Pubspec Assist is a Visual Studio Code extension that allows you to easily add dependencies to your [Dart](https://dart.dev/) and [Flutter](https://flutter.dev/) project's `pubspec.yaml`, all without leaving your editor.

<img src="https://i.imgur.com/W2cGuPL.gif" style="width: 600px"/>

## Usage

Simply open the Command Palette (by default, `Ctrl+Shift+P` on Windows, `⌘+Shift+P` on Mac) and search for "Pubspec Assist".

Then, choose any of the available options (see the video above).

**Pro-tip: You can search for multiple packages at a time by separating every package name with a comma (`bloc, cloud_firestore, provider`).**

## Download

[Download the latest version here.](https://marketplace.visualstudio.com/items?itemName=jeroen-meijer.pubspec-assist)

## Features

### Get the latest version for your packages.

**Pubspec Assist will get you the latest version of whatever package you are looking for**, puts it in your `pubspec.yaml` and formats the file automatically. If you already have the package in your `pubspec.yaml`, Pubspec Assist automatically updates it to the latest version for you. Oh, and it also supports `dev_dependencies`!

### Never leave VS Code.

**Forget going to the [pub.dev](https://pub.dev/) to search for your packages and copy the dependency text.**<br/>
You can look for and import packages directly from VS Code without ever switching windows.

### Smart (Fuzzy) search.

**Pubspec Assist is smart about finding what you're trying to search for.**<br/>
It gets you the most likely package you want and will give you a selection to choose from otherwise and **sorts them by relevance**.

### Automatically sort dependencies.

**Pubspec Assist automatically sorts your dependencies after adding a new package.**<br/>
This makes it easy to manage packages from multiple sources, such as local packages, ones hosted on Git, somewhere else or regular packages from [pub.dev](https://pub.dev/).

Already have your dependencies set up? **Just use the sort command to instantly sort your existing dependencies.**

### Compatible with multiple projects.

**Pubspec Assist will add your new dependencies to the `pubspec.yaml` that's open in your editor.**<br/>
Don't have your `pubspec.yaml` file opened? No problem - the package will be added to the `pubspec.yaml` in the root of your workspace.

<img src="https://i.imgur.com/Mnlr0UK.gif" style="width: 560px" />

---

## Requirements

- Visual Studio Code
- An internet connection
- A sense of relief after installation.

## Roadmap

Some features that are planned for the future, in order of expected implementation.

- Search/batch add/update multiple packages.
- Command for updating all packages.
- Auto-complete while searching.

## Bugs and feature requests

If you have any bugs or feature requests to report, please check out the issues on the GitHub repository or create a new one.
