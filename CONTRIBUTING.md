# Contributing to Simple-Jekyll-Search

This is fork from Christian Lei's [Simple-Jekyll-Search](https://github.com/christian-fei/Simple-Jekyll-Search) repository,
which was archived on March 2022.
I wanted to keep the project alive since I use it for my own theme [Type-on-strap](https://github.com/sylhare/Type-on-Strap)

Thank you for considering contributing to Simple-Jekyll-Search! 
We welcome contributions of all kinds, including bug fixes, feature requests, documentation improvements, and more.

## Developer Setup

### Prerequisites

This project uses Yarn v4 as the package manager. Install Yarn v4 if you haven't already:

```bash
# Install Yarn v4 globally
npm install -g yarn@4

# Or using corepack (recommended)
corepack enable
corepack prepare yarn@4 --activate
```

### Install Dependencies

Install the dependencies and build the project:

```bash
yarn
```

Lint, build and run the tests:

```bash
yarn build
```

#### Acceptance tests

This should start and kill the example jekyll blog and run the cypress tests.
Make sure to `build` before so you run the tests against the latest version.

```bash
npm run cypress:run 
```
