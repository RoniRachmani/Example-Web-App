// Fixes the npm advisories Dependabot reports as "No update possible": a transitive package held
// back by an exact pin in `overrides` or by its parent's version range. Dependabot never edits
// `overrides`, so this script does. Run by workflows/security-auto-fix.yml from the repo root.
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES = ['front-end', 'back-end'];

const npm = (cwd, ...args) => execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

// npm audit exits non-zero when it finds anything, so read its output regardless
const audit = (cwd) => JSON.parse(spawnSync('npm', ['audit', '--json'], { cwd, encoding: 'utf8' }).stdout).vulnerabilities ?? {};

// Packages with an advisory of their own, not the ones flagged only for depending on them
const advised = (vulnerabilities) => Object.values(vulnerabilities).filter((v) => v.via.some((via) => typeof via === 'object'));

const major = (version) => Number(version.split('.')[0]);

const lockedMajors = (cwd, name) => {
  const { packages } = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'));
  return Object.entries(packages)
    .filter(([path]) => path.endsWith(`node_modules/${name}`))
    .map(([, { version }]) => major(version));
};

const fixed = [];
const crossMajor = [];
const unfixed = [];

for (const cwd of PACKAGES) {
  // Lifecycle scripts stay off: this job holds a token that can write to the repo.
  // Exits non-zero when it leaves anything unfixed, which the overrides below deal with.
  spawnSync('npm', ['audit', 'fix', '--ignore-scripts'], { cwd, stdio: 'ignore' });

  const path = join(cwd, 'package.json');
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const direct = { ...manifest.dependencies, ...manifest.devDependencies };

  for (const { name } of advised(audit(cwd))) {
    // Dependabot updates direct dependencies, and npm refuses an override that disagrees with one
    if (name in direct) continue;

    const latest = npm(cwd, 'view', name, 'version').trim();
    const crossesMajor = lockedMajors(cwd, name).some((m) => m < major(latest));
    // A range, not an exact pin, so later patches aren't blocked the way 1.16.1 blocked 1.16.2
    manifest.overrides = { ...manifest.overrides, [name]: `^${latest}` };
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
    (crossesMajor ? crossMajor : fixed).push(`${cwd}: ${name} ^${latest}`);
  }

  npm(cwd, 'install', '--ignore-scripts');
  unfixed.push(...advised(audit(cwd)).map(({ name }) => `${cwd}: ${name}`));
}

const report = [
  ...fixed.map((line) => `- ${line}`),
  ...crossMajor.map((line) => `- ${line} (new major version)`),
  ...unfixed.map((line) => `- ${line} (still vulnerable, no fix found)`),
].join('\n');
console.log(report || 'No overrides needed.');

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `cross-major=${crossMajor.length > 0}\nreport<<EOF\n${report}\nEOF\n`);
}
