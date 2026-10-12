// Moves focus to the first field with an error. Call it with the form element
// and the errors that were just set, keyed by field name in form order.
export function focusFirstInvalid(form, errors) {
  const name = Object.keys(errors).find(key => errors[key]);
  if (name) form.elements[name]?.focus();
}

// Returns a message for an empty or malformed email, or '' if it's fine.
export function emailError(input) {
  if (!input.value.trim()) return 'Please enter your email address.';
  if (input.validity.typeMismatch) return 'Please enter a valid email address.';
  return '';
}
