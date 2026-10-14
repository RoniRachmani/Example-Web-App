import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  envTemplate, itemTemplate, parseProdEnv, prodEnvTemplate, ENV_ITEM, PROD_ENV_ITEM, VAULT,
} from '../scripts/secrets-1password.js';

test('itemTemplate stores each key as a concealed field', () => {
  const item = itemTemplate(ENV_ITEM, { MONGODB_USERNAME: 'user', MONGODB_PASSWORD: 'secret' });

  assert.equal(item.title, ENV_ITEM);
  const fields = item.fields.filter(field => field.type === 'CONCEALED');
  assert.deepEqual(fields.map(({ label, value }) => [label, value]), [
    ['MONGODB_USERNAME', 'user'],
    ['MONGODB_PASSWORD', 'secret'],
  ]);
});

test('envTemplate points each key at its field in the .env item', () => {
  const text = envTemplate(['MONGODB_USERNAME', 'MONGODB_PASSWORD']);

  assert.ok(text.includes(`\nMONGODB_USERNAME=op://${VAULT}/${ENV_ITEM}/MONGODB_USERNAME\n`));
  assert.ok(text.includes(`\nMONGODB_PASSWORD=op://${VAULT}/${ENV_ITEM}/MONGODB_PASSWORD\n`));
});

test('parseProdEnv reads the env_variables of prod-env.yaml', () => {
  const text = 'env_variables:\n  MONGODB_USERNAME: "user"\n  MONGODB_PASSWORD: \'p@ss:word\'\n';

  assert.deepEqual(parseProdEnv(text), { MONGODB_USERNAME: 'user', MONGODB_PASSWORD: 'p@ss:word' });
});

test('prodEnvTemplate points each key at its field in the prod item', () => {
  const text = prodEnvTemplate(['MONGODB_USERNAME']);

  assert.ok(text.includes(`\nenv_variables:\n  MONGODB_USERNAME: "{{ op://${VAULT}/${PROD_ENV_ITEM}/MONGODB_USERNAME }}"\n`));
});

test('the committed templates hold no values', () => {
  for (const file of ['.env.tpl', 'prod-env.yaml.tpl']) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#') && line !== 'env_variables:');
    assert.ok(lines.every(line => line.includes(`op://${VAULT}/`)), file);
  }
});
