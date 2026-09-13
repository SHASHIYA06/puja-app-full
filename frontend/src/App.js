import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';
import ResidentDirectory from './ResidentDirectory';
import AdminPanel from './AdminPanel';
import { api } from './api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('ggofa_token') || '');
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('HOME'); // HOME, DIRECTORY, ADMIN

  useEffect(() => {
    if (token) {
      const userFlat = localStorage.getItem('ggofa_user_flat') || '';
      api.getProfile(token, userFlat).then(userData => {
        setUser(userData);
      }).catch(() => {});
    }
  }, [token]);

  function saveToken(tok) {
    localStorage.setItem('ggofa_token', tok);
    setToken(tok);
  }

  function logout() {
    localStorage.removeItem('ggofa_token');
    localStorage.removeItem('ggofa_user_flat');
    setToken('');
    setUser(null);
    setCurrentTab('HOME');
  }

  return (
    <div className="app-shell">
      {/* Dynamic Background Festive Animation Particles */}
      <div className="festive-particles">
        <div className="diya-particle p1">🪔</div>
        <div className="diya-particle p2">✨</div>
        <div className="diya-particle p3">🌸</div>
        <div className="diya-particle p4">🪔</div>
        <div className="diya-particle p5">✨</div>
      </div>

      {/* Main Top Header Navbar */}
      <header className="main-header glass-card">
        <div className="header-brand" onClick={() => setCurrentTab('HOME')}>
          <img src="/maa_durga.jpg" alt="Maa Durga" className="brand-logo-img" />
          <div className="brand-text">
            <h1>GGOFA DURGA PUJA 2026</h1>
            <p>Official Society Management & Contribution Portal</p>
          </div>
        </div>

        <nav className="header-nav">
          <button 
            className={`nav-btn ${currentTab === 'HOME' ? 'active' : ''}`}
            onClick={() => setCurrentTab('HOME')}
          >
            {token ? '🏠 Resident Portal' : '🔑 Sign In / Activate'}
          </button>

          <button 
            className={`nav-btn ${currentTab === 'DIRECTORY' ? 'active' : ''}`}
            onClick={() => setCurrentTab('DIRECTORY')}
          >
            🏢 Resident Directory
          </button>

          <button 
            className={`nav-btn ${currentTab === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setCurrentTab('ADMIN')}
          >
            👑 Committee Admin
          </button>
        </nav>
      </header>

      {/* Countdown / Festive Greeting Banner */}
      <div className="greeting-banner glass-card">
        <span className="sparkle">✨</span>
        <p>
          <strong>Subho Sharadiya 2026!</strong> GGOFA Durga Puja Celebration & Prasad Registration is Live!
        </p>
        <span className="sparkle">✨</span>
      </div>

      {/* Main Container Area */}
      <main className="main-content">
        {currentTab === 'DIRECTORY' ? (
          <ResidentDirectory />
        ) : currentTab === 'ADMIN' ? (
          <AdminPanel />
        ) : (
          !token ? (
            <Auth setToken={saveToken} setUser={setUser} />
          ) : (
            <Dashboard token={token} onLogout={logout} />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="main-footer glass-card">
        <p>© 2026 GGOFA Durga Puja Committee. All Rights Reserved.</p>
        <p className="footer-sub">Built with Devotional Pride & Advanced Engineering Excellence for GGOFA Residents.</p>
      </footer>
    </div>
  );
}

export default App;
