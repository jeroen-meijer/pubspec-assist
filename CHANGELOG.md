# Change Log
All notable changes to the "pubspec-assist" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 0.1.0 - 2018-09-15
- Initial beta release.

## 0.2.0 - 2018-09-17
### Changed
- Update existing dependency entry with latest version if it's already there instead of adding a second entry. 
- Change default search threshold to **0.5** (from **1.0**).
- Change extension entry point to `pubspec-assist.openInput` (from `extension.openInput`).
- New changelog formatting based on Keep a Changelog.
### Added
- Add boolean setting for automatically adding a package on a very close match to search query (`pubspec-assist.autoAddPackage`).