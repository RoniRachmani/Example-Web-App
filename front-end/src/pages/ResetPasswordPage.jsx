import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import FormField from '../FormField';
import { emailError, focusFirstInvalid } from '../formValidation';
import { authErrorMessage } from '../errorMessages';

export default function ResetPasswordPage() {
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState('');

  async function sendLink(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const errors = { email: emailError(form.elements.email) };
    setFieldErrors(errors);
    setError('');

    if (errors.email) {
      focusFirstInvalid(form, errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setSentTo(email);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <title>Reset Password | Blogify</title>
    <h1>Reset Password</h1>
    {sentTo ? (
      // The same message whether or not the account exists, so this page
      // can't be used to find out who has one.
      <p role='status'>
        If there&apos;s an account for {sentTo}, we&apos;ve emailed a link to reset its password.
      </p>
    ) : (
      <form className='auth-form' noValidate onSubmit={sendLink}>
        <p>Enter your email address and we&apos;ll send you a link to choose a new password.</p>
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
        <button type='submit' disabled={isSubmitting}>Send Reset Link</button>
      </form>
    )}
    <p><Link to='/login' state={state}>Back to log in</Link></p>
    </>
  );
}
