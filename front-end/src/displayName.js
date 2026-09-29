import { updateProfile } from 'firebase/auth';
import { MAX_DISPLAY_NAME_LENGTH, countChars, normalizeDisplayName } from './text';

// Returns [name, error]: the cleaned-up name to save, or a message to show.
// The server applies the same rules (back-end/src/text.js).
export function validateDisplayName(input) {
  const name = normalizeDisplayName(input);

  if (!name) {
    return [null, 'Please enter a display name.'];
  }

  if (countChars(input.trim()) > MAX_DISPLAY_NAME_LENGTH) {
    return [null, `Display names can be at most ${MAX_DISPLAY_NAME_LENGTH} characters.`];
  }

  return [name, null];
}

export async function saveDisplayName(user, displayName) {
  await updateProfile(user, { displayName });
  // updateProfile keeps the new ID token if the server returns one. Refresh
  // anyway so the server sees the new name claim on the next comment, and
  // useUser re-renders, even if it doesn't: otherwise the old token (with no
  // name, or the old one) stays in use for up to an hour.
  try {
    await user.getIdToken(true);
  } catch {
    // The name is already saved, so don't report a failed save. The token
    // still refreshes on its own within the hour.
  }
}
