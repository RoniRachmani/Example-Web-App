import { updateProfile } from 'firebase/auth';

// The server also cuts names to this length (MAX_DISPLAY_NAME_LENGTH in back-end/src/app.js).
export const MAX_DISPLAY_NAME_LENGTH = 50;

export async function saveDisplayName(user, displayName) {
  await updateProfile(user, { displayName });
  // Existing ID tokens keep the old name claim until they expire, so refresh
  // now for the server to see the new name on the next comment.
  await user.getIdToken(true);
}
