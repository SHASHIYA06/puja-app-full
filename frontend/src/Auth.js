import axios from 'axios';
import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL;

function Auth({ setToken }) {
  const [flat_number, setFlat] = useState('');
  const [owner_name, setOwner] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginFlat, setLoginFlat] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [msg, setMsg] = useState('');

  function handleRegister(e) {
    e.preventDefault();
    axios.post(`${API}/first-login`, {
      flat_number,
      owner_name,
      contact,
      email,
      password,
    })
    .then(() => setMsg('Registered! You can now log in.'))
    .catch(e => setMsg(e.response?.data?.message || 'Error'));
  }

  function handleLogin(e) {
    e.preventDefault();
    axios.post(`${API}/login`, {
      flat_number: loginFlat,
      password: loginPassword,
    })
    .then(res => {
      setToken(res.data.token);
    })
    .catch(e => setMsg("Login failed: " + (e.response?.data?.message || "")));
  }

  return (
    <div>
      <h2>First Time Registration</h2>
      <form onSubmit={handleRegister}>
        <input placeholder="Flat Number" value={flat_number} onChange={e => setFlat(e.target.value)} required />
        <input placeholder="Owner Name" value={owner_name} onChange={e => setOwner(e.target.value)} required />
        <input placeholder="Contact (number)" value={contact} onChange={e => setContact(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Register/Activate</button>
      </form>

      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input placeholder="Flat Number" value={loginFlat} onChange={e => setLoginFlat(e.target.value)} required />
        <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      <p>{msg}</p>
    </div>
  );
}
export default Auth;
