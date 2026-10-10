import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { authErrorMessage } from '../errorMessages';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function logIn(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
      navigate('/articles');
    } catch (err) {
      setError(authErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <title>Log In | Blogify</title>
    <h1>Log In</h1>
    <form className='auth-form' onSubmit={logIn}>
      {error && <p role='alert'>{error}</p>}
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
          autoComplete='current-password'
          value={password}
          onChange={e => setPassword(e.target.value)} />
      </label>
      <button type='submit' disabled={isSubmitting}>Log In</button>
    </form>
    <p><Link to='/create-account'>Don&apos;t have an account? Create one here</Link></p>
    </>
  );
}
