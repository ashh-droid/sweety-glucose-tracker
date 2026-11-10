import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import { api } from './lib/api.js';
import './tokens.css';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    api('/auth/me').then(({ user }) => { if (alive) setUser(user); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); }
    finally { setUser(null); }
  }
  if (loading) return <div className="boot-splash"><div className="boot-heart">♥</div><p>Loading Sweety...</p></div>;
  return user ? <Dashboard user={user} onLogout={logout}/> : <AuthScreen onLogin={setUser}/>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
