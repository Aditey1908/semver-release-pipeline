# Changelog

All notable changes to this project are documented in this file. It is generated automatically by [semantic-release](https://github.com/semantic-release/semantic-release) from [Conventional Commits](https://www.conventionalcommits.org) — do not edit it by hand.

## [1.2.0](https://github.com/Aditey1908/semver-release-pipeline/compare/v1.1.1...v1.2.0) (2026-10-22)

### Features

* **api:** add version parse endpoint ([e82a461](https://github.com/Aditey1908/semver-release-pipeline/commit/e82a461f43c25898b24f096f69e2677dabe24c15))

### Documentation

* **report:** show the rollback with the current interface ([359d212](https://github.com/Aditey1908/semver-release-pipeline/commit/359d212c8d8f9127ae5dfdc36036b06fbb211138))

## [1.1.1](https://github.com/Aditey1908/semver-release-pipeline/compare/v1.1.0...v1.1.1) (2026-10-21)

### Bug Fixes

* **deps:** bump express from 5.2.1 to 5.3.0 ([#6](https://github.com/Aditey1908/semver-release-pipeline/issues/6)) ([eb3d2ce](https://github.com/Aditey1908/semver-release-pipeline/commit/eb3d2ced67c7b8c550f199742b012cf2a8712814))

### Documentation

* **report:** add a PDF export and refresh figures for the current history ([7fb35a1](https://github.com/Aditey1908/semver-release-pipeline/commit/7fb35a1cdb2d7a4b52835d5ab5ec07bf64de50c2))
* **report:** add pipeline results with figures and faculty in-charge ([#2](https://github.com/Aditey1908/semver-release-pipeline/issues/2)) ([2e2edc7](https://github.com/Aditey1908/semver-release-pipeline/commit/2e2edc75089db3da4c5e74c9d942273e7680c716))

## [1.1.0](https://github.com/Aditey1908/semver-release-pipeline/compare/v1.0.0...v1.1.0) (2026-10-07)

### Features

* **ui:** rebuild the dashboard in React with neobrutalism.dev components ([459f6f5](https://github.com/Aditey1908/semver-release-pipeline/commit/459f6f5a8aa4be10c91673f8d800fc0e75c283c8))

### Documentation

* describe the new dashboard stack and add team members to the report ([44797c6](https://github.com/Aditey1908/semver-release-pipeline/commit/44797c6873c01b4a6e590442857b2beebf2c3d22))
* **setup:** cover private repositories and private GHCR images ([5388362](https://github.com/Aditey1908/semver-release-pipeline/commit/538836226f9780b3817f9872a3334f8bb9e2a58c))

### Continuous Integration

* **commitlint:** accept Dependabot's capitalised "Bump" subjects ([6d6f5c4](https://github.com/Aditey1908/semver-release-pipeline/commit/6d6f5c40e5ee98ebd221ec1ea21af68abb0d474c))
* **dependabot:** hold the changelog preset at v9 until semantic-release supports v10 ([bd26962](https://github.com/Aditey1908/semver-release-pipeline/commit/bd26962d5455c9a553eb54783c7a0bde6fff59d5))

## 1.0.0 (2026-10-06)

### Features

* **api:** add version, release and semver endpoints ([105e97f](https://github.com/Aditey1908/semver-release-pipeline/commit/105e97f000244a9167b70b919afd52116bf4b184))
* **core:** add semantic versioning engine ([afdd32d](https://github.com/Aditey1908/semver-release-pipeline/commit/afdd32de06c923781316d7d6adbb1944d2fd07fc))
* **core:** parse the generated changelog into release history ([1ca2d64](https://github.com/Aditey1908/semver-release-pipeline/commit/1ca2d64d1f7496c5ffa46d0b8af89daee4ac3f34))
* **core:** predict the next release from conventional commits ([9b02bdb](https://github.com/Aditey1908/semver-release-pipeline/commit/9b02bdb040f80fd6328f365eb666b5339e32322d))
* **ui:** add release dashboard with next-version calculator ([84b1209](https://github.com/Aditey1908/semver-release-pipeline/commit/84b1209da5e076369a6e29757514ade43c9f7799))

### Documentation

* add README, setup guide, demo guide and project report ([942c568](https://github.com/Aditey1908/semver-release-pipeline/commit/942c5683c203f8897fa9f863fc68b92e834822b5))

### Build System

* **docker:** add multi-stage image and compose deployment manifest ([a556443](https://github.com/Aditey1908/semver-release-pipeline/commit/a5564431c1267d916e4e12fb7b84a021cabb402f))

### Continuous Integration

* automate releases with semantic-release and versioned deployments ([9571489](https://github.com/Aditey1908/semver-release-pipeline/commit/957148976d4ead40af482c89571aaf5386006dde))
