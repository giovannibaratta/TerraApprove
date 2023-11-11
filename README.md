[![codebeat badge](https://codebeat.co/badges/4958e7a7-5e47-4210-8beb-167ed55078e8)](https://codebeat.co/projects/github-com-giovannibaratta-terraapprove-main) [![Coverage Status](https://coveralls.io/repos/github/giovannibaratta/TerraApprove/badge.svg?branch=main)](https://coveralls.io/github/giovannibaratta/TerraApprove?branch=main)

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

## How to release a new version

Tag a commit, push it to the main branch and manually run the GitHub Action "Build and Publish Artifact" specifying the tag.

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```