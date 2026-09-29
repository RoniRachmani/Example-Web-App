// Text limits and clean-up shared by the server and the browser. front-end/src/text.js
// must stay identical to this file; back-end/test/text.test.js fails if they differ.

export const MAX_COMMENT_LENGTH = 1000;
export const MAX_DISPLAY_NAME_LENGTH = 50;

// Lengths count Unicode code points, so an emoji like 😀 is one character on both
// sides. (An input's maxLength and String.length count UTF-16 units, where it's two.)
export function countChars(text) {
  return [...text].length;
}

// Control characters never belong in a name, and bidi overrides and isolates can
// make one display reversed.
const UNSAFE_CHARS = /[\p{Cc}‪-‮⁦-⁩]/gu;
export function removeUnsafeChars(text) {
  return text.replace(UNSAFE_CHARS, '');
}

// Characters that show nothing on their own: format characters like zero-width
// spaces, lone combining marks, spaces, and blank-looking letters and symbols.
const INVISIBLE_CHARS = /[\p{Cf}\p{M}\p{Z}ᅟᅠ⠀ㅤﾠ]/gu;

// Returns the name to show, or '' if nothing visible is left. Long names are cut
// to MAX_DISPLAY_NAME_LENGTH characters, on a grapheme boundary so emoji
// sequences, flags and accented letters aren't split.
export function normalizeDisplayName(name) {
  const cleaned = removeUnsafeChars(name).trim();

  if (!cleaned.replace(INVISIBLE_CHARS, '')) {
    return '';
  }

  let result = '';
  let length = 0;
  for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(cleaned)) {
    length += countChars(segment);
    if (length > MAX_DISPLAY_NAME_LENGTH) break;
    result += segment;
  }

  return result.trim();
}
