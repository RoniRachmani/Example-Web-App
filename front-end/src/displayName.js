import { updateProfile } from 'firebase/auth';

// The server also cuts names to this length (MAX_DISPLAY_NAME_LENGTH in back-end/src/app.js).
export const MAX_DISPLAY_NAME_LENGTH = 50;

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
