import { useState, useEffect } from 'react';
import { getAuth, onIdTokenChanged } from 'firebase/auth';

const useUser = () => {
  const [state, setState] = useState({ isLoading: true, user: null });

  useEffect(() => {
    // onIdTokenChanged also fires when the token is refreshed, which
    // saveDisplayName does after changing the name. Storing a new object each
    // time makes components re-render, since Firebase updates the user in place.
    const unsubscribe = onIdTokenChanged(getAuth(), function(user) {
      setState({ isLoading: false, user });
    });

    return unsubscribe;
  }, []);

  return state;
}

export default useUser;