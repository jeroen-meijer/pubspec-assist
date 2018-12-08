# Change Log

All notable changes to the "pubspec-assist" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## 0.3.0 - 2018-10-05

### Changed

- Improve bug reporting and error handling.

## 0.3.1 - 2018-11-29

### Changed

- Updated dependencies.

## 0.3.2 - 2018-12-08

### Changed

- Fix bug where new imported packages would replace existing similarly named packages. (Mentioned in issues: #2)
