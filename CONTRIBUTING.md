# Contributing

## Releasing

Releases use [releasearoni](https://github.com/bcomnes/releasearoni) and [npm-bump](https://github.com/bcomnes/npm-bump).

- Navigate to the Actions tab and select `Version and Release`.
- Run the workflow on `master`, choosing `patch`, `minor`, `major`, or `custom`.
- For `custom`, also supply the desired version in `new-version`.
- The workflow runs tests, updates the version and changelog, builds declarations, pushes the release commit and tag, creates the GitHub release, and publishes to npm.

The npm package must have a GitHub Actions trusted publisher configured for owner `bcomnes`, repository `argsclopts`, and workflow `release.yml`. The workflow uses OIDC (`id-token: write`) rather than an `NPM_TOKEN` secret.

For a local release:

- Use Node.js `^22.13.0 || >=24` and npm 10 or newer.
- Ensure a clean working tree on an up-to-date `master` and run `npm install` and `npm test`.
- Run `npm version {patch,minor,major}` to update the version and generate the changelog.
- Run `npm publish`. The `releasearoni` prepublish hook checks npm authentication, builds declarations, pushes the branch and tags, and creates the GitHub release. Local publishing also requires GitHub authentication.

## Testing

Run `npm test` for ESLint, TypeScript checks, and the Node.js test runner. Native Node.js coverage is printed to the terminal and written to the ignored `lcov.info` file. Run `npm run build` to regenerate TypeScript declarations.

## Guidelines

- Patches, ideas and changes welcome.
- Fixes almost always welcome.
- Features sometimes welcome.
  - Please open an issue to discuss the issue prior to spending lots of time on the problem.
  - It may be rejected.
  - If you don't want to wait around for the discussion to commence, and you really want to jump into the implementation work, be prepared for fork if the idea is respectfully declined.
- Try to stay within the style of the existing code.
- All tests must pass.
- Additional features or code paths must be tested.
- Aim for 100% coverage.
- Questions are welcome, however unless there is a official support contract established between the maintainers and the requester, support is not guaranteed.
- Contributors reserve the right to walk away from this project at any moment with or without notice.
