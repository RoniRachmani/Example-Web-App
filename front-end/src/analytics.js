import { getApp } from 'firebase/app';

// Google Analytics sets cookies, so it only starts once the visitor agrees.
// The choice is kept in this browser: 'granted', 'denied', or null when they
// haven't chosen yet (or asked to choose again).
const STORAGE_KEY = 'analytics-consent';
const listeners = new Set();
// Resolves to the Analytics module and instance once Analytics has started
let analytics = null;

function readConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let consent = readConsent();

export function getConsent() {
  return consent;
}

export function subscribeToConsent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setConsent(value) {
  consent = value;
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage is blocked: the choice lasts until the page is closed.
  }
  applyConsent();
  listeners.forEach(listener => listener());
}

// Starts Analytics once consent is given. It's downloaded only then, so visitors
// who decline never load it. It can't be unloaded, so if the visitor withdraws
// consent later it stops collecting instead.
export function applyConsent() {
  const enabled = consent === 'granted';
  if (!enabled && !analytics) return;

  analytics ??= import('firebase/analytics')
    .then(module => ({ module, instance: module.getAnalytics(getApp()) }));

  analytics
    .then(({ module, instance }) => module.setAnalyticsCollectionEnabled(instance, enabled))
    .catch(() => {
      // Couldn't load (e.g. offline or blocked): try again next time
      analytics = null;
    });
}
