import { useState, useEffect } from 'react';
import { getAuth, onIdTokenChanged } from 'firebase/auth';

const useUser = () => {
  const [state, setState] = useState({ isLoading: true, user: null });

  useEffect(() => {
    // onIdTokenChanged also fires when the token changes, which happens when
    // saveDisplayName changes the name, and on every hourly token refresh.
    // Firebase updates the user in place, so store a new object (and re-render)
    // only when the user or what components show about them has changed.
    const unsubscribe = onIdTokenChanged(getAuth(), function(user) {
      setState(prev => {
        const unchanged = !prev.isLoading
          && prev.user === user
          && prev.displayName === user?.displayName
          && prev.email === user?.email;

        return unchanged
          ? prev
          : { isLoading: false, user, displayName: user?.displayName, email: user?.email };
      });
    });

    return unsubscribe;
  }, []);

  return state;
}

export default useUser;