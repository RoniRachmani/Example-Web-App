import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const MAX_DISPLAY_NAME_LENGTH = 50;

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function createAccount() {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError('Please enter a display name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match!');
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(getAuth(), email, password);
      await updateProfile(user, { displayName: trimmedName });
      // The token issued at sign-up has no name claim; refresh it so the
      // server sees the display name on this session's first comment.
      await user.getIdToken(true);
      navigate('/articles');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
    <h1>Create Account</h1>
    {error && <p>{error}</p>}
    <input
      placeholder='Display name (shown on your comments)'
      maxLength={MAX_DISPLAY_NAME_LENGTH}
      value={displayName}
      onChange={e => setDisplayName(e.target.value)} />
    <input
      placeholder='Your email address'
      value={email}
      onChange={e => setEmail(e.target.value)} />
    <input
      placeholder='Your password'
      type='password'
      value={password}
      onChange={e => setPassword(e.target.value)} />
    <input
      placeholder='Confirm password'
      type='password'
      value={confirmPassword}
      onChange={e => setConfirmPassword(e.target.value)} />
    <button onClick={createAccount}>Create Account</button>
    <Link to='/login'>Already have an account? Log In</Link>
    </>
  );
}