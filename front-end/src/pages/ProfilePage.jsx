import { useState } from 'react';
import { Link } from 'react-router-dom';
import useUser from '../useUser';
import { MAX_DISPLAY_NAME_LENGTH, saveDisplayName } from '../displayName';

export default function ProfilePage() {
  const { isLoading, user } = useUser();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <>
      <h1>Profile</h1>
      <p><Link to='/login'>Log in</Link> to edit your profile.</p>
      </>
    );
  }

  return <ProfileForm user={user} />;
}

function ProfileForm({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setMessage('Please enter a display name.');
      return;
    }

    setIsSaving(true);
    try {
      await saveDisplayName(user, trimmedName);
      setDisplayName(trimmedName);
      setMessage('Display name saved.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
    <h1>Profile</h1>
    <p>Signed in as {user.email}</p>
    {message && <p>{message}</p>}
    <label>
      Display name (shown on your comments):
      <input
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        value={displayName}
        onChange={e => setDisplayName(e.target.value)} />
    </label>
    <button disabled={isSaving} onClick={save}>Save</button>
    </>
  );
}
