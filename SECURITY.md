# Security Policy

## Supported versions

Only the latest code on `main`, which is what is deployed, receives fixes.

## Reporting a vulnerability

Please don't open a public issue for security problems. Report them privately through [GitHub's private vulnerability reporting](https://github.com/RoniRachmani/Example-Web-App/security/advisories/new) and include:

- what the issue is and where it is (file, route or dependency)
- steps to reproduce it, or a proof of concept
- the impact you expect

You should hear back within a week.

## Notes

- The Firebase web config in `front-end/src/firebase.js` is public by design. Access is enforced by Firebase Authentication and by the back end verifying ID tokens.
- Dependabot watches both npm packages and the GitHub Actions workflows for vulnerable or outdated dependencies.
