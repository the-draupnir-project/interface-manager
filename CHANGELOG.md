<!--
SPDX-FileCopyrightText: 2024 Gnuxie <Gnuxie@protonmail.com>

SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2024-10-07

### Added

- `<h1>` through `<h6>` are now supported in DeadDocument.

- `<hr />` is now supported in DeadDocument.

## [2.4.1] - 2024-09-27

### Changed

- Improved inference on `MatrixInterfaceAdaptor['describeRenderer']`.


## [2.4.0] - 2024-09-20

### Changed

- Verify that commands have renderers inside command dispatcher.

## [2.3.0] - 2024-09-11

### Changed

- Upgraded to `@the-draupnir-project/matrix-basic-types@0.2.0`.
- Upgraded to `@gnuxie/typescript-result@1.0.0`.

## [2.2.0] - 2024-09-10

### Changed

- `RestParameterDescription` can now only prompt one presentation for rest.

## [2.1.0] - 2024-09-10

### Added

- `CommandExecutorHelper` now has a `parseAndInvoke` method to aid unit testing
  commands.

### Changed

- When an argument is missing, command parsers will always get a
  `PromptRequiredError` if a prompt is available on the associated parameter
  description.

## [2.0.0] - 2024-09-09

### Changed

- `MatrixInterfaceAdaptor` callbacks have been simplified and moved into a
  common interface.

## [1.1.1] - 2024-09-09

### Fixed

- `CommandExecutorHelper` type inference.
- `CommandExecutorHelper` keyword properties are now partial instead of
  required.

## [1.1.0] - 2024-09-09

### Added

- `CommandExecutorHelper` to help unit test command executors.

## [1.0.2] - 2024-09-06

### Fixed

- A bug where command designators were not interned into command
  entries.

## [1.0.1] - 2024-09-06

### Fixed

- `CompleteCommand.toPartialCommand()` method was missing after
  parsing commands with the standard command parser.

## [1.0.0] - 2024-09-06

### Changed

- Everything.
- Better inference from parameter descriptions, no need to specify
  types in the executor.
- Tests moved from Draupnir, some bugs squashed.
- Too much work done.

## [0.1.0] - 2024-08-22

- Initial release.
