import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { saveDisplayName, validateDisplayName } from '../displayName';
import { authErrorMessage } from '../errorMessages';

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function createAccount(e) {
    e.preventDefault();
    const [name, nameError] = validateDisplayName(displayName);

    if (nameError) {
      setError(nameError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match!');
      return;
    }

    // Stays disabled from here on unless sign-up fails, so a second click can't
    // try to create the same account again.
    setIsSubmitting(true);

    let user;
    try {
      ({ user } = await createUserWithEmailAndPassword(getAuth(), email, password));
    } catch (err) {
      setError(authErrorMessage(err));
      setIsSubmitting(false);
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
    <title>Create Account | Blogify</title>
    <h1>Create Account</h1>
    <form className='auth-form' onSubmit={createAccount}>
      {error && <p role='alert'>{error}</p>}
      <label>
        Display name (shown on your comments)
        <input
          autoComplete='nickname'
          value={displayName}
          onChange={e => setDisplayName(e.target.value)} />
      </label>
      <label>
        Email
        <input
          type='email'
          autoComplete='email'
          value={email}
          onChange={e => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input
          type='password'
          autoComplete='new-password'
          value={password}
          onChange={e => setPassword(e.target.value)} />
      </label>
      <label>
        Confirm password
        <input
          type='password'
          autoComplete='new-password'
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} />
      </label>
      <button type='submit' disabled={isSubmitting}>Create Account</button>
    </form>
    <p><Link to='/login'>Already have an account? Log In</Link></p>
    </>
  );
}
