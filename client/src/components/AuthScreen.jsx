import { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
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
      const result = await api(isRegister ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify(body) });
      onLogin(result.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function toggle() {
    setError('');
    setIsRegister(!isRegister);
  }

  return (
    <div className="auth-layout">
      <section className="auth-story" aria-label="About Sweety">
        <Brand />
        <div className="story-content">
          <div className="eyebrow light"><Sparkles size={14}/> THE SMALL THINGS MATTER</div>
          <h1>A little care,<br/><em>every day.</em></h1>
          <p>Make sense of your glucose readings with a calm, simple space to track them.</p>
          <div className="story-highlights">
            <div><CheckCircle2 size={18}/> Four moments each day</div>
            <div><CheckCircle2 size={18}/> Daily & monthly summaries</div>
            <div><ShieldCheck size={18}/> Your readings stay yours</div>
          </div>
        </div>
        <div className="story-footer">A personal log, not a substitute for medical guidance.</div>
      </section>
      <main className="auth-main">
        <div className="mobile-brand"><Brand compact/></div>
        <div className="auth-panel">
          <div className="auth-symbol"><LockKeyhole size={22}/></div>
          <span className="eyebrow">WELCOME TO SWEETY</span>
          <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted auth-subtitle">{isRegister ? 'A clear picture of your day starts here.' : 'Sign in to see your readings and reports.'}</p>
          <form onSubmit={submit} noValidate>
            {isRegister && <label className="field">Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required minLength="2" maxLength="80" /></label>}
            <label className="field">Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            <label className="field">Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} required minLength="8" /></label>
            {error && <div role="alert" className="alert error">{error}</div>}
            <button className="button primary full" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button>
          </form>
          <p className="switch-auth">{isRegister ? 'Already have an account?' : 'New to Sweety?'} <button type="button" className="text-button" onClick={toggle}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
          <p className="security-note"><ShieldCheck size={15}/> Passwords are hashed and readings are private.</p>
        </div>
      </main>
    </div>
  );
}
