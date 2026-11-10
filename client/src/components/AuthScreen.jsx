import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Brand from './Brand.jsx';
import { api } from '../lib/api.js';

const demoVisible = import.meta.env.VITE_SHOW_DEMO === 'true';
const demoEmail = 'demo@sweety.local';
const demoPassword = 'Demo12345!';

function readableError(message) {
  if (message === 'Invalid email or password.') {
    return "That email and password don't match. Try again.";
  }
  if (message === 'An account with this email already exists.') {
    return "There's already an account with this email.";
  }
  if (message === 'Unable to reach the server. Check that the API is running.') {
    return "We can't reach Sweety right now. Check your connection and try again.";
  }
  return message;
}

function previewDay() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata'
  }).format(new Date());
}

export default function AuthScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const emailTaken = error === "There's already an account with this email.";

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Enter your name.');
      return;
    }
    setBusy(true);
    try {
      const body = isRegister ? { name, email, password } : { email, password };
      const { user } = await api(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      onLogin(user);
    } catch (err) {
      setError(readableError(err.message));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(toRegister = !isRegister) {
    setIsRegister(toRegister);
    setError('');
    setPassword('');
    setShowPassword(false);
  }

  function useDemo() {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setShowPassword(false);
    setError('');
  }

  return (
    <div className="auth-layout">
      <section className="auth-story" aria-label="About Sweety">
        <Brand tone="dark" />
        <div className="story-content">
          <h1 className="auth-title">Your sugar,<br/><em>sorted.</em></h1>
          <p className="auth-story-subtitle">
            Log your four daily glucose readings in a few taps, and see how today and this month are going.
          </p>
          <div className="story-sample" aria-label="Illustrative fictional glucose reading preview">
            <div className="sample-title">Today · {previewDay()} · 2 of 4</div>
            <div className="sample-headers">
              <span>Fasting</span><span>Breakfast</span><span>Lunch</span><span>Dinner</span>
            </div>
            <div className="sample-values">
              <strong>104</strong><strong>128</strong>
              <strong className="sample-now">Now</strong><strong className="sample-later">Later</strong>
            </div>
            <div className="sample-footer">This month: avg 116 · 9 of 9 within reference band</div>
          </div>
          <p className="sample-caption">Illustrative values only, not real patient readings.</p>
        </div>
        <p className="story-footer">For tracking only. Talk to your doctor about your numbers.</p>
      </section>

      <main className="auth-main">
        <div className="auth-main-inner">
          <div className="mobile-auth-brand">
            <Brand compact />
            <p className="mobile-auth-headline">Your sugar, <em>sorted.</em></p>
          </div>
          <div className="auth-panel">
            <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p className="auth-subtitle">{isRegister ? 'It takes under a minute.' : "Sign in to log today's readings."}</p>
            <form onSubmit={submit} noValidate>
              {isRegister && <div className="field">
                <label htmlFor="auth-name">What should we call you?</label>
                <input id="auth-name" autoComplete="name" value={name}
                  onChange={(event) => setName(event.target.value)} placeholder="Priya"
                  required minLength={2} maxLength={80} disabled={busy} />
              </div>}
              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input id="auth-email" type="email" autoComplete="email" value={email}
                  onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com"
                  required disabled={busy}/>
              </div>
              <div className="field">
                <label htmlFor="auth-password">Password</label>
                <div className="password-field">
                  <input id="auth-password" type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password} onChange={(event) => setPassword(event.target.value)}
                    required minLength={8} disabled={busy}
                    aria-describedby={isRegister ? 'password-helper' : undefined}/>
                  <button className="password-toggle" type="button" disabled={busy}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {isRegister && <p className="password-helper" id="password-helper">At least 8 characters.</p>}
              </div>
              {error && <div role="alert" className="alert error auth-error">
                {error}
                {emailTaken && isRegister && <> <button type="button" className="inline-link"
                  onClick={() => switchMode(false)}>Sign in instead</button></>}
              </div>}
              <button className="button primary full" type="submit" disabled={busy}>
                {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
                <ArrowRight size={18}/>
              </button>
            </form>
            <p className="switch-auth">{isRegister ? 'Already have an account?' : 'New here?'}{' '}
              <button type="button" className="inline-link"
                onClick={() => switchMode()} disabled={busy}>
                {isRegister ? 'Sign in' : 'Create an account'}
              </button>
            </p>
            {isRegister && <p className="security-note">
              Only you can see your readings. Passwords are stored as hashes, never as plain text.
            </p>}
            {demoVisible && !isRegister && <div className="demo-entry">
              <span>Just looking around? Try the demo account.</span>
              <button type="button" className="inline-link" onClick={useDemo} disabled={busy}>Use demo</button>
            </div>}
          </div>
        </div>
      </main>
    </div>
  );
}
