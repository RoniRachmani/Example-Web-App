import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupFileName, mongodumpArgs, mongodumpConfig } from '../scripts/backup-db.js';
import { DB_NAME } from '../src/db.js';

test('backupFileName names the database and the time, without colons', () => {
  const name = backupFileName(new Date('2026-10-26T09:05:03.123Z'));

  assert.equal(name, `${DB_NAME}-2026-10-26T09-05-03Z.archive.gz`);
});

test('mongodumpConfig keeps every character of the connection string', () => {
  const uri = 'mongodb+srv://user:p@ss"wo\\rd: #x@cluster0.example.net/?retryWrites=true';

  assert.equal(mongodumpConfig(uri), `uri: ${JSON.stringify(uri)}\n`);
  assert.equal(JSON.parse(mongodumpConfig(uri).slice('uri: '.length)), uri);
});

test('mongodumpArgs dumps only the app database, and keeps the connection string off the command line', () => {
  const args = mongodumpArgs('/tmp/x/mongodump.yaml', 'backups/a.archive.gz');

  assert.deepEqual(args, [
    '--config', '/tmp/x/mongodump.yaml', '--db', DB_NAME, '--gzip', '--archive=backups/a.archive.gz', '--quiet',
  ]);
  assert.ok(!args.some(arg => arg.startsWith('mongodb')));
});
