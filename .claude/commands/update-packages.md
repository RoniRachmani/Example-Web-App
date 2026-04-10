Update all npm dependencies to their latest versions.

Steps:
1. In `back-end/`, run `npx npm-check-updates -u` then `npm install`
2. In `front-end/`, run `npx npm-check-updates -u` then `npm install`
3. If there are peer dependency conflicts, pin the conflicting packages to compatible versions and retry
4. Report what was updated
