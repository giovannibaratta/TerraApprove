[![Coverage Status](https://coveralls.io/repos/github/giovannibaratta/TerraApprove/badge.svg?branch=main)](https://coveralls.io/github/giovannibaratta/TerraApprove?branch=main)

# TerraApprove

TerraApprove is a project created to experiment with new technologies (e.g. GitHub Copilot, devcontainers) and project management activities on something that is a little more than a toy project.

See [here](https://giovannibaratta.github.io/TerraApprove/) for the list of supported features.

## Folder structure

The folder structure is as follows:

```bash
.
├── artifacts # Contains the artifacts (executables, ...) of the project
├── core # Contains the source code of the application
└── examples # Contains examples of how the application can be used
```

## How to build

The project can be built using the following command:

```bash
cd core
yarn install
yarn generate:artifact
```
