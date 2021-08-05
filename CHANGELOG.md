# iHub ifc-freight-api-orders Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Given a version number `MAJOR.MINOR.PATCH`, increment the:
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.
>
> Additional labels for pre-release and build metadata are available as extensions to the `MAJOR.MINOR.PATCH` format.

## Changelog entry snippet

``` markdown
## [X.Y.Z] - yyyy-mm-dd

### Added
### Fixed
### Changed
### Removed
```

## Version summary

| Tag                      | Release date |
| ------------------------ | -----------: |
| [1.2.2](#122-2021-05-13) |   2021-05-13 |
| [1.2.1](#121-2021-05-10) |   2021-05-10 |
| [1.2.0](#120-2021-02-24) |   2021-02-24 |
| [1.1.1](#111-2020-01-14) |   2020-01-14 |

## [1.2.2] - 2021-05-13

### Fixed

- Validations without payload

## [1.2.1] - 2021-05-10

### Changed

- Validation on confirmation of the approved token
- Changing the flow of receiving data from the easy route

## [1.2.0] - 2021-02-24

### Added

- Added fields in the schema __orderId__ and __internalOrderId__
- Added new feed options __created-ihub__ and __approved__
- Sending information to the core after order created and approved

## [1.1.1] - 2020-01-14

### Added

- Added new field originOrderId to query on feed api
