import AuthContext from '../AuthContext';
import { authDestination } from '../authDestination';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import FormField from '../FormField';
import { emailError, focusFirstInvalid } from '../formValidation';
import { authErrorMessage } from '../errorMessages';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  // Set by links that send a visitor here to log in, so they land back where they were.
  const { state } = useLocation();

  async function logIn(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const errors = {
      email: emailError(form.elements.email),
      password: password ? '' : 'Please enter your password.',
    };
    setFieldErrors(errors);
    setError('');

    if (errors.email || errors.password) {
      focusFirstInvalid(form, errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
      navigate(authDestination(state));
    } catch (err) {
      setError(authErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <title>Log In | Blogify</title>
    <h1>Log In</h1>
    <AuthContext state={state} />
    <form className='auth-form' noValidate onSubmit={logIn}>
      {error && <p role='alert' className='form-error'>{error}</p>}
      <FormField
        label='Email'
        name='email'
        type='email'
        autoComplete='email'
        required
        error={fieldErrors.email}
        value={email}
        onChange={e => setEmail(e.target.value)} />
      <FormField
        label='Password'
        name='password'
        type='password'
        autoComplete='current-password'
        required
        error={fieldErrors.password}
        value={password}
        onChange={e => setPassword(e.target.value)} />
      <button type='submit' disabled={isSubmitting}>Log In</button>
    </form>
    <p><Link to='/reset-password' state={state}>Forgot your password?</Link></p>
    <p><Link to='/create-account' state={state}>Don&apos;t have an account? Create one here</Link></p>
    </>
  );
}
