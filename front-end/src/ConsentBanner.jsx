import { useSyncExternalStore } from 'react';
import { getConsent, setConsent, subscribeToConsent } from './analytics';

export default function ConsentBanner() {
  const consent = useSyncExternalStore(subscribeToConsent, getConsent);

  if (consent) {
    return null;
  }

  return (
    <aside className='consent-banner' aria-label='Cookie consent'>
      <p>We&apos;d like to use Google Analytics cookies to see how people use Blogify. Is that OK?</p>
      <button onClick={() => setConsent('granted')}>Accept</button>
      <button onClick={() => setConsent('denied')}>Decline</button>
    </aside>
  );
}
