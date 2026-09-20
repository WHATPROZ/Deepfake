import { useEffect, useMemo, useState } from 'react';
import OptionWheel from './OptionWheel';
import SideRays from './SideRays';
import { isLoggedIn, logout } from './features/auth/authState';
import './index.css';

const LAST_OPTION_KEY = 'deepnox-last-option';
const DEFAULT_OPTION = 'UPLOAD';

function normalizeOption(label) {
  return String(label || '').toUpperCase();
}

function getInitialSelectedIndex(options) {
  if (typeof window === 'undefined') return options.indexOf(DEFAULT_OPTION);

  const lastOption = normalizeOption(window.sessionStorage.getItem(LAST_OPTION_KEY));
  const directMatch = options.indexOf(lastOption);
  if (directMatch >= 0) return directMatch;

  if (lastOption === 'LOGIN' || lastOption === 'LOGOUT') {
    const authIndex = options.findIndex(option => option === 'LOGIN' || option === 'LOGOUT');
    if (authIndex >= 0) return authIndex;
  }

  return Math.max(0, options.indexOf(DEFAULT_OPTION));
}

function rememberOption(label) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(LAST_OPTION_KEY, normalizeOption(label));
}

function OptionsPage() {
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());

  const options = useMemo(
    () => [
      'ABOUT DEEPNOX',
      'UPLOAD',
      'PREVIOUS ACTIVITY',
      'REPORTS',
      loggedIn ? 'LOGOUT' : 'LOGIN',
      'TEAM'
    ],
    [loggedIn]
  );
  const defaultSelected = useMemo(() => getInitialSelectedIndex(options), [options]);

  useEffect(() => {
    document.title = 'Options';

    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener('storage', syncAuth);
    window.addEventListener('deepnox-auth-change', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('deepnox-auth-change', syncAuth);
    };
  }, []);

  return (
    <main
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#02010b',
        overflow: 'hidden'
      }}
    >
      <SideRays
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%'
        }}
      >
        <OptionWheel
          key={`${loggedIn ? 'logged-in' : 'logged-out'}-${defaultSelected}`}
          items={options}
          defaultSelected={defaultSelected}
          side="left"
          fontSize={3.6}
          spacing={2}
          curve={1.35}
          tilt={6}
          blur={2}
          smoothing={420}
          inset={80}
          loop={true}
          onActivate={(idx, label) => {
            const normalizedLabel = normalizeOption(label);

            if (normalizedLabel === 'ABOUT DEEPNOX') {
              rememberOption(normalizedLabel);
              window.history.pushState({}, '', '/about');
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else if (normalizedLabel === 'UPLOAD') {
              rememberOption(normalizedLabel);
              window.history.pushState({}, '', '/upload');
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else if (normalizedLabel === 'PREVIOUS ACTIVITY') {
              rememberOption(normalizedLabel);
              window.history.pushState({}, '', '/previous-activity');
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else if (normalizedLabel === 'REPORTS') {
              rememberOption(normalizedLabel);
              window.history.pushState({}, '', '/reports');
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else if (normalizedLabel === 'LOGIN') {
              rememberOption(normalizedLabel);
              window.history.pushState({}, '', '/login');
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else if (normalizedLabel === 'LOGOUT') {
              rememberOption('LOGIN');
              logout();
            } else if (normalizedLabel === 'TEAM') {
              rememberOption(normalizedLabel);
              window.history.pushState({}, '', '/team');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
        />
      </div>
    </main>
  );
}

export default OptionsPage;
