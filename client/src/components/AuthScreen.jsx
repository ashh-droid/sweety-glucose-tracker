import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import Brand from './Brand.jsx';
import { api } from '../lib/api.js';

export default function AuthScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = isRegister ? { name, email, password } : { email, password };
      const { user } = await api(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST', body: JSON.stringify(body)
      });
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setError('');
    setIsRegister((value) => !value);
  }

  return (
    <div className="auth-layout">
      <section className="auth-story" aria-label="About Sweety">
        <Brand tone="dark" />
        <div className="story-content">
          <p className="story-kicker">THE DAILY LOGBOOK</p>
          <h1>Make room for<br/><em>the everyday.</em></h1>
          <p>A simple place for your four daily readings, with the details ready when you need them.</p>
          <div className="story-sample" aria-hidden="true">
            <span>Tuesday / 10 Nov</span>
            <div><b>Fasting</b><b>Breakfast</b><b>Lunch</b><b>Dinner</b></div>
            <div className="sample-values"><strong>104</strong><strong>128</strong><strong>·</strong><strong>·</strong></div>
          </div>
        </div>
        <p className="story-footer">A tracking tool, not medical advice.</p>
      </section>
      <main className="auth-main">
        <div className="mobile-auth-brand"><Brand compact /></div>
        <div className="auth-panel">
          <div className="auth-symbol"><LockKeyhole size={20} /></div>
          <p className="section-kicker">YOUR PRIVATE LOGBOOK</p>
          <h2>{isRegister ? 'Create an account' : 'Welcome back'}</h2>
          <p className="auth-subtitle">{isRegister ? 'Start your daily record.' : 'Sign in to pick up where you left off.'}</p>
          <form onSubmit={submit} noValidate>
            {isRegister && <label className="field">Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required minLength="2" maxLength="80" /></label>}
            <label className="field">Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            <label className="field">Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required minLength="8" /></label>
            {error && <div role="alert" className="alert error">{error}</div>}
            <button className="button primary full" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button>
          </form>
          <p className="switch-auth">{isRegister ? 'Already registered?' : 'New to Sweety?'} <button type="button" className="inline-link" onClick={switchMode}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
          <p className="security-note">Your password is hashed and readings are private to your account.</p>
        </div>
      </main>
    </div>
  );
}
