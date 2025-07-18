import React, { useState } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  function saveToken(tok) {
    localStorage.setItem('token', tok);
    setToken(tok);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
  }

  return (
    <div>
      {!token
        ? <Auth setToken={saveToken} />
        : <Dashboard token={token} onLogout={logout} />
      }
    </div>
  );
}
export default App;
