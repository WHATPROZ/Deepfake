const AUTH_KEY = 'deepnox-authenticated';

export function isLoggedIn() {
  return typeof window !== 'undefined' && window.localStorage.getItem(AUTH_KEY) === 'true';
}

export function login() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_KEY, 'true');
  window.dispatchEvent(new Event('deepnox-auth-change'));
}

export function logout() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('deepnox-auth-change'));
}
