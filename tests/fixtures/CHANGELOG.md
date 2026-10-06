# Changelog

All notable changes to this project are documented in this file. It is generated automatically by [semantic-release](https://github.com/semantic-release/semantic-release) from [Conventional Commits](https://www.conventionalcommits.org) — do not edit it by hand.

## [2.0.0](https://github.com/acme/semver-release-pipeline/compare/v1.1.0...v2.0.0) (2026-10-06)

### ⚠ BREAKING CHANGES

* **api:** /api/semver/next is now /api/predict

### Features

* **api:** rename next endpoint ([26fa61e](https://github.com/acme/semver-release-pipeline/commit/26fa61e9f343a02d7e1c242f36df921b1451dc58))

### Bug Fixes

* trim input ([91616b9](https://github.com/acme/semver-release-pipeline/commit/91616b9cfee13673bec5c7e24b3739b4ff1acddd))

### Continuous Integration

* tweak workflow ([0a0a99b](https://github.com/acme/semver-release-pipeline/commit/0a0a99bfcd337b4130cc4160faa60cd59fd1a953))

## [1.1.0](https://github.com/acme/semver-release-pipeline/compare/v1.0.1...v1.1.0) (2026-10-06)

### Features

* **ui:** add release history timeline ([18f2173](https://github.com/acme/semver-release-pipeline/commit/18f2173730b8effc0353bd60058a47722227cd17))

### Performance Improvements

* **core:** cache parsed versions ([8b28492](https://github.com/acme/semver-release-pipeline/commit/8b28492c8b59e8ac680094c61615b1a317e03ffa))

## [1.0.1](https://github.com/acme/semver-release-pipeline/compare/v1.0.0...v1.0.1) (2026-10-06)

### Bug Fixes

* **api:** return 400 for malformed versions ([82ca7f9](https://github.com/acme/semver-release-pipeline/commit/82ca7f951d8c3e2197892cc391226157875e9584)), closes [#12](https://github.com/acme/semver-release-pipeline/issues/12)

### Documentation

* improve readme ([795370e](https://github.com/acme/semver-release-pipeline/commit/795370e405c0edf5393a77cd79e9b9e2f1ffb298))

## 1.0.0 (2026-10-06)

### Features

* **api:** add express service ([1bb8d61](https://github.com/acme/semver-release-pipeline/commit/1bb8d61ab7977016bd88c8f7d224d62306d16eb3))
* **core:** add semantic version engine ([ffea6c1](https://github.com/acme/semver-release-pipeline/commit/ffea6c10a88c4af2e7d99fd74ab35bf77a21bbe3))
