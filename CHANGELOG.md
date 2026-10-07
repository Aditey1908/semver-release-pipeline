# Changelog

All notable changes to this project are documented in this file. It is generated automatically by [semantic-release](https://github.com/semantic-release/semantic-release) from [Conventional Commits](https://www.conventionalcommits.org) — do not edit it by hand.

## [1.1.0](https://github.com/Aditey1908/semver-release-pipeline/compare/v1.0.0...v1.1.0) (2026-10-07)

### Features

* **ui:** rebuild the dashboard in React with neobrutalism.dev components ([987628c](https://github.com/Aditey1908/semver-release-pipeline/commit/987628cd6b48a525e30241bb554ee9cf061f2e11))

### Documentation

* describe the new dashboard stack and add team members to the report ([2d9618c](https://github.com/Aditey1908/semver-release-pipeline/commit/2d9618c33ce87965ea104ef2051357c40318fa7e))
* **setup:** cover private repositories and private GHCR images ([24cb053](https://github.com/Aditey1908/semver-release-pipeline/commit/24cb05342ae8ffaac4c0a034e7d92466583ee6d8))

### Continuous Integration

* **commitlint:** accept Dependabot's capitalised "Bump" subjects ([542dce4](https://github.com/Aditey1908/semver-release-pipeline/commit/542dce4a737cd15e75f30517282280182ff69c36))
* **dependabot:** hold the changelog preset at v9 until semantic-release supports v10 ([a15adc8](https://github.com/Aditey1908/semver-release-pipeline/commit/a15adc8eaccba63e0dd58f1fd8c7bbca46cfc255))

## 1.0.0 (2026-10-06)

### Features

* **api:** add version, release and semver endpoints ([b9df6a2](https://github.com/Aditey1908/semver-release-pipeline/commit/b9df6a2f1688b0dff2696f9fb3323cfa7d677083))
* **core:** add semantic versioning engine ([f4f4571](https://github.com/Aditey1908/semver-release-pipeline/commit/f4f457160a7b2e5ee653a413e7e11b408810cd34))
* **core:** parse the generated changelog into release history ([99183ed](https://github.com/Aditey1908/semver-release-pipeline/commit/99183ed0a80b57565a330a212cc67caf2f23b193))
* **core:** predict the next release from conventional commits ([65b278b](https://github.com/Aditey1908/semver-release-pipeline/commit/65b278b0bc7a40f65a22f4a0a7ad0ea306117bb6))
* **ui:** add release dashboard with next-version calculator ([70e0b8e](https://github.com/Aditey1908/semver-release-pipeline/commit/70e0b8e494d79b4a1e047febe3abbae1dc9af289))

### Documentation

* add README, setup guide, demo guide and project report ([c2dc8d5](https://github.com/Aditey1908/semver-release-pipeline/commit/c2dc8d5f0abdfac5d4f73de980281056f291931f))

### Build System

* **docker:** add multi-stage image and compose deployment manifest ([3f78e4a](https://github.com/Aditey1908/semver-release-pipeline/commit/3f78e4a4d5a04438199e894a3e8e912d945d6240))

### Continuous Integration

* automate releases with semantic-release and versioned deployments ([5765042](https://github.com/Aditey1908/semver-release-pipeline/commit/57650422603b66c48dfbb1cbc6b38ddd09070620))
