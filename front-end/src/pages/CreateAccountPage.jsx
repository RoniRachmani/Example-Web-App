import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { saveDisplayName, validateDisplayName } from '../displayName';
import FormField from '../FormField';
import { emailError, focusFirstInvalid } from '../formValidation';
import { authErrorMessage } from '../errorMessages';

const MIN_PASSWORD_LENGTH = 6;

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  // Passed on from the log-in page, so a new member lands back where they were.
  const { state } = useLocation();

  async function createAccount(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const [name, nameError] = validateDisplayName(displayName);

    // Every problem at once, so the form doesn't take one attempt per field.
    const errors = {
      displayName: nameError || '',
      email: emailError(form.elements.email),
      password: '',
      confirmPassword: '',
    };

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "The passwords don't match.";
    }

    setFieldErrors(errors);
    setError('');

    if (Object.values(errors).some(Boolean)) {
      focusFirstInvalid(form, errors);
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
      navigate(state?.from || '/articles');
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
    <form className='auth-form' noValidate onSubmit={createAccount}>
      {error && <p role='alert' className='form-error'>{error}</p>}
      <FormField
        label='Display name (shown on your comments)'
        name='displayName'
        autoComplete='nickname'
        required
        error={fieldErrors.displayName}
        value={displayName}
        onChange={e => setDisplayName(e.target.value)} />
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
        autoComplete='new-password'
        required
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        error={fieldErrors.password}
        value={password}
        onChange={e => setPassword(e.target.value)} />
      <FormField
        label='Confirm password'
        name='confirmPassword'
        type='password'
        autoComplete='new-password'
        required
        error={fieldErrors.confirmPassword}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)} />
      <button type='submit' disabled={isSubmitting}>Create Account</button>
    </form>
    <p><Link to='/login' state={state}>Already have an account? Log In</Link></p>
    </>
  );
}
