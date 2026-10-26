// Saves a copy of the app's database with mongodump, because the free Atlas
// tier keeps no backups of its own. Needs the MongoDB Database Tools
// (`brew install mongodb-database-tools`). Run from back-end/, with the same
// .env (or MONGODB_URI) as the server:
//   npm run backup-db   # writes backups/full-stack-react-db-<time>.archive.gz
//
// The archive holds every article document, commenters' uids included, so it
// is gitignored and readable only by you. Store it somewhere private.
// To restore one, replacing the articles that are there now:
//   mongorestore --uri "<connection string>" --gzip --archive=backups/<file> --drop
import dotenv from 'dotenv';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DB_NAME, mongoUri } from '../src/db.js';

export const BACKUP_DIR = 'backups';

// Sorts by time and has no colons, which some file systems don't allow.
export function backupFileName(date = new Date()) {
  const time = date.toISOString().replace(/\.\d+Z$/, 'Z').replaceAll(':', '-');
  return `${DB_NAME}-${time}.archive.gz`;
}

// A mongodump --config file. A JSON string is a valid YAML double-quoted
// value, so any character in the password is kept as it is.
export function mongodumpConfig(uri) {
  return `uri: ${JSON.stringify(uri)}\n`;
}

export function mongodumpArgs(configPath, archivePath) {
  return ['--config', configPath, '--db', DB_NAME, '--gzip', `--archive=${archivePath}`, '--quiet'];
}

if (import.meta.main) {
  dotenv.config();
  if (!process.env.MONGODB_URI && !(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD)) {
    console.error('Set MONGODB_URI, or MONGODB_USERNAME and MONGODB_PASSWORD in .env (npm run secrets:pull).');
    process.exit(1);
  }

  mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  const archivePath = join(BACKUP_DIR, backupFileName());

  // The connection string goes through a private temp file rather than the
  // command line, where other processes could see the password.
  const dir = mkdtempSync(join(tmpdir(), 'backup-db-'));
  const configPath = join(dir, 'mongodump.yaml');
  let result;
  try {
    writeFileSync(configPath, mongodumpConfig(mongoUri()), { mode: 0o600 });
    result = spawnSync('mongodump', mongodumpArgs(configPath, archivePath), { stdio: 'inherit' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  if (result.error?.code === 'ENOENT') {
    console.error('mongodump not found. Install the MongoDB Database Tools: brew install mongodb-database-tools');
    process.exit(1);
  }
  if (result.status !== 0) {
    rmSync(archivePath, { force: true });
    console.error('mongodump failed; no backup was written.');
    process.exit(1);
  }

  chmodSync(archivePath, 0o600);
  console.log(`Saved ${archivePath}.`);
}
