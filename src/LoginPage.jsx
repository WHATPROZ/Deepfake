import { useEffect } from 'react';
import LightTunnel from './components/LightTunnel/LightTunnel';
import { login } from './features/auth/authState';
import './LoginPage.css';

export default function LoginPage() {
  useEffect(() => {
    document.title = 'Login';
  }, []);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleSubmit = event => {
    event.preventDefault();
    login();
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="login-page">
      <div className="login-bg" aria-hidden="true">
        <LightTunnel
          className="login-light-tunnel-bg"
          cableColor="#A855F7"
          pulseColor="#A855F7"
          tunnelColor="#5227FF"
          tunnelOpacity={0}
          speed={0.1}
          flowDirection="outward"
          pulseSpeed={2}
          pulseLength={0.28}
          pulseBlend={1}
          pulseWidth={1}
          cableCount={20}
          thickness={0.35}
          rimWidth={0.15}
          waviness={0.3}
          sway={0.5}
          size={1.0}
          centerX={0.0}
          centerY={0.0}
          glow={1.0}
          fadeNear={0.5}
          fadeFar={2}
          brightness={1.0}
          colorVariance={true}
          grain={true}
          grainIntensity={0.05}
          opacity={1.0}
          mouseInteraction={true}
          mouseStrength={0.1}
        />
      </div>

      <button className="login-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">&larr;</span>
      </button>

      <section className="login-shell" aria-label="Login">
        <p className="login-kicker">Login</p>
        <form className="login-panel" onSubmit={handleSubmit}>
          <h1> LOGIN YOUR ACCOUNT</h1>
          <label>
            Email
            <input type="email" placeholder="you@deepnox.ai" autoComplete="email" required />
          </label>

          <label>
            Password
            <input type="password" placeholder="Enter password" autoComplete="current-password" required />
          </label>

          <button type="submit">Login</button>
        </form>
      </section>
    </main>
  );
}
