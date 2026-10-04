Update all npm dependencies to their latest versions.

Steps:
1. In `back-end/`, run `npx npm-check-updates -u` then `npm install`
2. In `front-end/`, run `npx npm-check-updates -u` then `npm install`
3. If there are peer dependency conflicts, pin the conflicting packages to compatible versions and retry
4. Keep the `overrides` blocks in both `package.json` files. They pin patched transitive dependencies. Run `npm audit` in each directory and report anything that's still open.
5. Verify: in `front-end/` run `npm run lint`, `npm run build` and `npm run test:e2e` (if `@playwright/test` changed, run `npx playwright install chromium` first). In `back-end/`, run `npm test`, then start the server briefly and confirm it gets past its imports.
6. Report what was updated, noting any major version bumps
