import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { countChars, normalizeDisplayName } from '../src/text.js';

describe('text rules', () => {
  it('are identical in the back end and the front end', async () => {
    const backEnd = await readFile(new URL('../src/text.js', import.meta.url), 'utf8');
    const frontEnd = await readFile(new URL('../../front-end/src/text.js', import.meta.url), 'utf8');
    assert.equal(frontEnd, backEnd, 'copy back-end/src/text.js to front-end/src/text.js');
  });

  it('counts an emoji as one character', () => {
    assert.equal(countChars('a😀'), 2);
  });

  it('treats names with nothing visible as blank', () => {
    for (const name of ['', '   ', '​', '⠀', 'ㅤ', '́', '️', '​ ‍']) {
      assert.equal(normalizeDisplayName(name), '', JSON.stringify(name));
    }
  });

  it('strips bidi overrides and control characters', () => {
    assert.equal(normalizeDisplayName('‮ecila‬'), 'ecila');
    assert.equal(normalizeDisplayName('Bob\u0000\n'), 'Bob');
  });

  it('keeps accented letters and emoji sequences', () => {
    assert.equal(normalizeDisplayName('  Zoë 👨‍👩‍👧  '), 'Zoë 👨‍👩‍👧');
  });

  it('cuts long names without splitting a grapheme', () => {
    assert.equal(normalizeDisplayName('A'.repeat(49) + '👨‍👩‍👧'), 'A'.repeat(49));
    assert.equal(normalizeDisplayName('A'.repeat(49) + '🇺🇸'), 'A'.repeat(49));
    assert.equal(normalizeDisplayName('A'.repeat(48) + '🇺🇸'), 'A'.repeat(48) + '🇺🇸');
  });
});
