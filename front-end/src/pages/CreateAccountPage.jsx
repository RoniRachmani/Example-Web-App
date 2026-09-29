import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { saveDisplayName, validateDisplayName } from '../displayName';

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function createAccount() {
    const [name, nameError] = validateDisplayName(displayName);

    if (nameError) {
      setError(nameError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match!');
      return;
    }

    let user;
    try {
      ({ user } = await createUserWithEmailAndPassword(getAuth(), email, password));
    } catch (e) {
      setError(e.message);
      return;
    }

    try {
      await saveDisplayName(user, name);
      navigate('/articles');
    } catch {
      // The account exists and the user is signed in, so retrying here would fail
      // with "email already in use". Let them set the name on the profile page.
      navigate('/profile', {
        state: { message: "Your account was created, but your display name couldn't be saved. Please set it here." },
      });
    }
  }

  return (
    <>
    <h1>Create Account</h1>
    {error && <p>{error}</p>}
    <input
      placeholder='Display name (shown on your comments)'
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