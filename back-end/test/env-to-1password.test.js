import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envTemplate, itemTemplate, ITEM, VAULT } from '../scripts/env-to-1password.js';

test('itemTemplate stores each key as a concealed field', () => {
  const item = itemTemplate({ MONGODB_USERNAME: 'user', MONGODB_PASSWORD: 'secret' });

  assert.equal(item.title, ITEM);
  const fields = item.fields.filter(field => field.type === 'CONCEALED');
  assert.deepEqual(fields.map(({ label, value }) => [label, value]), [
    ['MONGODB_USERNAME', 'user'],
    ['MONGODB_PASSWORD', 'secret'],
  ]);
});

test('envTemplate points each key at its field and holds no values', () => {
  const text = envTemplate(['MONGODB_USERNAME', 'MONGODB_PASSWORD']);

  assert.match(text, new RegExp(`^MONGODB_USERNAME=op://${VAULT}/${ITEM}/MONGODB_USERNAME$`, 'm'));
  assert.match(text, new RegExp(`^MONGODB_PASSWORD=op://${VAULT}/${ITEM}/MONGODB_PASSWORD$`, 'm'));
});
