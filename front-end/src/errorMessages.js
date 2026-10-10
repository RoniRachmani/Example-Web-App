// Messages people can act on, instead of Firebase's and Axios's raw errors
// (e.g. "Firebase: Error (auth/invalid-credential).").

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-password': 'Please enter a password.',
  'auth/weak-password': 'Passwords must be at least 6 characters.',
  'auth/password-does-not-meet-requirements': 'Please choose a stronger password.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': "Couldn't reach the server. Check your connection and try again.",
};

export function authErrorMessage(error) {
  return AUTH_MESSAGES[error?.code] ?? 'Something went wrong. Please try again.';
}

// For a failed /api request. `failed` says what didn't happen, e.g.
// "Your comment couldn't be posted."
export function apiErrorMessage(error, failed) {
  switch (error?.response?.status) {
    case 401:
      return `${failed} Your sign-in has expired, so please log in again.`;
    case 429:
      return `${failed} You're doing that too often, so please wait a few minutes.`;
    default:
      return `${failed} Please try again.`;
  }
}
