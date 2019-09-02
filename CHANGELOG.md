# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
* Added cascade option to TRUNCATE TABLE
* Added remove on deletion from relationship option to the relationship decorator
* Disabling of constraint checks via options argument to initializeStore
* Complex indexed values
    * Indexes can now be built against any object, not just primitives
    * Indexes are built deterministically using object-hash, so there's no need
    * Values can now be queried using index values or other properties using the findXBy functions. If a value hasn't been indexed then it falls back to a normal, slow filter and warns.
* findAllBy and findOneBy
    * Supports queries for non-primary key properties
    * findOneBy throws an exception if no values are found or if many values are found

### Changed

### Removed

[1.0.0]: https://github.com/ducharmemp/mobstr/compare/v1.0.0-alpha.0...HEAD
[0.3.2]: https://github.com/ducharmemp/mobstr/compare/v0.3.2...v1.0.0-alpha.0
[0.3.1]: https://github.com/ducharmemp/mobstr/compare/v0.3.1...v0.3.2
[0.3.0]: https://github.com/ducharmemp/mobstr/compare/v0.3.0...v0.3.1
[0.2.1]: https://github.com/ducharmemp/mobstr/compare/v0.2.1...v0.3.0
[0.2.0]: https://github.com/ducharmemp/mobstr/compare/v0.2.0...v0.2.1
[0.1.5]: https://github.com/ducharmemp/mobstr/compare/v0.1.5...v0.2.0
[0.1.4]: https://github.com/ducharmemp/mobstr/compare/v0.1.4...v0.1.5
[0.1.3]: https://github.com/ducharmemp/mobstr/compare/v0.1.3...v0.1.4
[0.1.2]: https://github.com/ducharmemp/mobstr/compare/v0.1.2...v0.1.3
[0.1.1]: https://github.com/ducharmemp/mobstr/compare/v0.1.1...v0.1.2
