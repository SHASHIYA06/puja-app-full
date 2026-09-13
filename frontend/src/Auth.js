import React, { useState } from 'react';
import { api } from './api';

function Auth({ setToken, setUser }) {
  const [activeTab, setActiveTab] = useState('LOGIN'); // LOGIN or REGISTER
  const [flat_number, setFlatNumber] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [owner_name, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!flat_number || !password) {
      setMsg('Please enter your flat number and password.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await api.login(flat_number.trim(), password);
      setToken(res.token);
      if (res.user) setUser(res.user);
      localStorage.setItem('ggofa_token', res.token);
      localStorage.setItem('ggofa_user_flat', flat_number.trim());
    } catch (err) {
      setMsg(err.message || 'Login failed. Check your flat number or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!flat_number || !password) {
      setMsg('Flat number and create password are required.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await api.firstLogin({
        flat_number: flat_number.trim(),
        owner_name: owner_name.trim(),
        contact: contact.trim(),
        email: email.trim(),
        password: password.trim()
      });
      setMsg(`✅ ${res.message}`);
      setActiveTab('LOGIN');
    } catch (err) {
      setMsg(`❌ ${err.message || 'Registration failed'}`);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoFlat(flatNo) {
    setFlatNumber(flatNo);
    setPassword('password123');
    setMsg(`Demo flat ${flatNo} loaded! Click Login.`);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-card 3d-tilt">
        <div className="auth-header">
          <img src="/maa_durga.jpg" alt="Maa Durga Logo" className="auth-durga-avatar" />
          <h2>GGOFA DURGA PUJA 2026</h2>
          <p>Official Resident Portal & Contribution Management</p>
        </div>

        <div className="auth-tabs">
          <button className={activeTab === 'LOGIN' ? 'active' : ''} onClick={() => { setActiveTab('LOGIN'); setMsg(''); }}>
            🔑 Resident Login
          </button>
          <button className={activeTab === 'REGISTER' ? 'active' : ''} onClick={() => { setActiveTab('REGISTER'); setMsg(''); }}>
            📝 First Time Activation
          </button>
        </div>

        {msg && <div className={`auth-alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {activeTab === 'LOGIN' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Flat Number</label>
              <input
                type="text"
                placeholder="e.g. 3D, 1A, 2F"
                value={flat_number}
                onChange={e => setFlatNumber(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-gold-submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Resident Dashboard 🪔'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Flat Number (Official Registry)</label>
              <input
                type="text"
                placeholder="e.g. 3D, 1A, 2F"
                value={flat_number}
                onChange={e => setFlatNumber(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label>Owner Name (As in Registry)</label>
              <input
                type="text"
                placeholder="e.g. SHASHI SHEKHAR MISHRA"
                value={owner_name}
                onChange={e => setOwnerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                placeholder="e.g. 9799494321"
                value={contact}
                onChange={e => setContact(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="owner@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Create New Password</label>
              <input
                type="password"
                placeholder="Create secure password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-gold-submit" disabled={loading}>
              {loading ? 'Activating...' : 'Activate Flat Account 🌺'}
            </button>
          </form>
        )}

        <div className="quick-demo-section">
          <span>Quick Demo Shortcuts:</span>
          <div className="demo-pills">
            <button type="button" onClick={() => fillDemoFlat('3D')}>Flat 3D</button>
            <button type="button" onClick={() => fillDemoFlat('1A')}>Flat 1A</button>
            <button type="button" onClick={() => fillDemoFlat('2F')}>Flat 2F</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
