import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useUser from '../useUser';
import { saveDisplayName, validateDisplayName } from '../displayName';
import { authErrorMessage } from '../errorMessages';

export default function ProfilePage() {
  const { isLoading, user } = useUser();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <>
      <title>Profile | Blogify</title>
      <h1>Profile</h1>
      <p><Link to='/login'>Log in</Link> to edit your profile.</p>
      </>
    );
  }

  // Keyed by uid so the form resets if a different user signs in (e.g. in another tab)
  // instead of saving the previous user's name to the new account.
  return <ProfileForm key={user.uid} user={user} />;
}

function ProfileForm({ user }) {
  const location = useLocation();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  // Set when sign-up created the account but couldn't save the name
  const [message, setMessage] = useState(location.state?.message || '');
  const [isSaving, setIsSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    const [name, nameError] = validateDisplayName(displayName);

    if (nameError) {
      setMessage(nameError);
      return;
    }

    setIsSaving(true);
    try {
      await saveDisplayName(user, name);
      setDisplayName(name);
      setMessage('Display name saved.');
    } catch (err) {
      setMessage(authErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
    <title>Profile | Blogify</title>
    <h1>Profile</h1>
    <p>Signed in as {user.email}</p>
    <form className='auth-form' onSubmit={save}>
      {message && <p role='status'>{message}</p>}
      <label>
        Display name (shown on your comments)
        <input
          autoComplete='nickname'
          value={displayName}
          onChange={e => setDisplayName(e.target.value)} />
      </label>
      <button type='submit' disabled={isSaving}>Save</button>
    </form>
    </>
  );
}
