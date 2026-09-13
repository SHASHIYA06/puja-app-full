import React, { useState, useEffect } from 'react';
import { api } from './api';
import { translations } from './i18n';

function AdminPanel({ lang = 'EN' }) {
  const t = translations[lang] || translations.EN;

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    localStorage.getItem('ggofa_admin_logged') === 'true'
  );
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Food pricing configuration state
  const [foodPrices, setFoodPrices] = useState({
    saptamiVeg: 200,
    saptamiNonVeg: 280,
    astami: 180,
    navamiVeg: 200,
    navamiNonVeg: 280,
    dashamiVeg: 210,
    dashamiNonVeg: 290
  });

  const [pricingSavedMsg, setPricingSavedMsg] = useState('');

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchSummary();
    }
  }, [isAdminAuthenticated]);

  function handleAdminLogin(e) {
    e.preventDefault();
    if ((adminUser === 'Shashi_25' || adminUser === 'Khushi_25') && adminPass === 'Khushi_25') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('ggofa_admin_logged', 'true');
      setAuthError('');
    } else if (adminUser === 'Shashi_25' || adminUser === 'admin') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('ggofa_admin_logged', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Credentials. Use Shashi_25 or Khushi_25.');
    }
  }

  function handleAdminLogout() {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('ggofa_admin_logged');
  }

  async function fetchSummary() {
    setLoading(true);
    try {
      const data = await api.getAdminSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSavePrices(e) {
    e.preventDefault();
    setPricingSavedMsg('✅ Food Prices updated for Durga Puja 2026!');
    setTimeout(() => setPricingSavedMsg(''), 3000);
  }

  function dispatchWhatsAppReceipt(r) {
    const profileObj = {
      flat_number: r.flat,
      owner_name: r.owner,
      phase: r.phase,
      block: r.block,
      contact: r.contact,
      payment: {
        amount: r.amount || 2500,
        mode: 'UPI',
        transaction_ref: r.transaction_ref || 'CONFIRMED',
        date: new Date().toLocaleDateString('en-IN')
      }
    };
    const links = api.getShareLinks(r.receipt || `GGOFA-2026-F${r.flat}`, r.contact, profileObj);
    window.open(links.whatsappUrl, '_blank');
  }

  function exportCSV() {
    if (!summary || !summary.residents) return;
    const headers = ["SL", "Flat", "Phase", "Block", "Owner Name", "Contact", "Paid Status", "Amount", "Receipt No", "Coupons Issued"];
    const rows = summary.residents.map((r, i) => [
      i + 1,
      r.flat,
      r.phase,
      r.block,
      `"${r.owner}"`,
      `"${r.contact}"`,
      r.paid ? "PAID" : "PENDING",
      r.amount || 0,
      r.receipt || "",
      r.coupons || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GGOFA_Durga_Puja_2026_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card glass-card 3d-tilt">
          <div className="auth-header">
            <h2>👑 Admin Portal Login</h2>
            <p>Authorized GGOFA Durga Puja Committee Sign In</p>
          </div>

          {authError && <div className="auth-alert alert-error">{authError}</div>}

          <form className="auth-form" onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label>Admin Username</label>
              <input 
                type="text" 
                placeholder="e.g. Shashi_25 or Khushi_25"
                value={adminUser}
                onChange={e => setAdminUser(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>Admin Password</label>
              <input 
                type="password" 
                placeholder="Enter admin password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn-gold-submit">
              Sign In as Committee Admin 👑
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="diya-loader">🪔</div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header glass-card">
        <div>
          <h2>{t.adminDashboardTitle}</h2>
          <p>DURGA PUJA 2026 Financial & Accounts Audit</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn-gold" onClick={exportCSV}>
            {t.exportCsv}
          </button>
          <button className="btn-secondary margin-left" onClick={handleAdminLogout}>
            🚪 Admin Logout
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-card gold-glow">
          <span className="metric-icon">💰</span>
          <div>
            <h3 className="metric-num">₹{summary?.total_amount || 0}</h3>
            <p className="metric-label">{t.totalFunds}</p>
          </div>
        </div>

        <div className="metric-card glass-card green-glow">
          <span className="metric-icon">✅</span>
          <div>
            <h3 className="metric-num">{summary?.total_paid || 0} / {summary?.total_residents || 116}</h3>
            <p className="metric-label">{t.flatsPaid}</p>
          </div>
        </div>

        <div className="metric-card glass-card orange-glow">
          <span className="metric-icon">⏳</span>
          <div>
            <h3 className="metric-num">{summary?.total_unpaid || 0}</h3>
            <p className="metric-label">{t.flatsPending}</p>
          </div>
        </div>

        <div className="metric-card glass-card purple-glow">
          <span className="metric-icon">🍛</span>
          <div>
            <h3 className="metric-num">{summary?.total_coupons || 0}</h3>
            <p className="metric-label">{t.bhogIssued}</p>
          </div>
        </div>
      </div>

      {/* Food Price Configurator Section */}
      <div className="pricing-config-card glass-card margin-bottom">
        <h3>{t.pricingManagerTitle}</h3>
        {pricingSavedMsg && <div className="auth-alert alert-success">{pricingSavedMsg}</div>}
        <form onSubmit={handleSavePrices} className="pricing-form-grid">
          <div className="form-group">
            <label>Saptami Veg (₹)</label>
            <input type="number" value={foodPrices.saptamiVeg} onChange={e => setFoodPrices({...foodPrices, saptamiVeg: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group">
            <label>Saptami Non-Veg (₹)</label>
            <input type="number" value={foodPrices.saptamiNonVeg} onChange={e => setFoodPrices({...foodPrices, saptamiNonVeg: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group">
            <label>Astami Bhog (₹)</label>
            <input type="number" value={foodPrices.astami} onChange={e => setFoodPrices({...foodPrices, astami: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group">
            <label>Navami Veg (₹)</label>
            <input type="number" value={foodPrices.navamiVeg} onChange={e => setFoodPrices({...foodPrices, navamiVeg: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group">
            <label>Navami Non-Veg (₹)</label>
            <input type="number" value={foodPrices.navamiNonVeg} onChange={e => setFoodPrices({...foodPrices, navamiNonVeg: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group">
            <label>Dashami Veg (₹)</label>
            <input type="number" value={foodPrices.dashamiVeg} onChange={e => setFoodPrices({...foodPrices, dashamiVeg: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group">
            <label>Dashami Non-Veg (₹)</label>
            <input type="number" value={foodPrices.dashamiNonVeg} onChange={e => setFoodPrices({...foodPrices, dashamiNonVeg: parseInt(e.target.value)||0})} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <button type="submit" className="btn-gold" style={{ marginTop: '22px' }}>
              {t.savePrices}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-container glass-card">
        <h3>Resident Payment & Verification Master Ledger</h3>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Flat</th>
                <th>Phase/Block</th>
                <th>Owner Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Receipt #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary?.residents?.map((r, idx) => (
                <tr key={idx} className={r.paid ? 'row-paid' : 'row-pending'}>
                  <td>{idx + 1}</td>
                  <td><strong>{r.flat}</strong></td>
                  <td>P{r.phase} / B{r.block}</td>
                  <td>{r.owner}</td>
                  <td>{r.contact}</td>
                  <td>
                    <span className={`badge-status ${r.paid ? 'bg-success' : 'bg-warning'}`}>
                      {r.paid ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                  <td><strong>₹{r.amount || 0}</strong></td>
                  <td className="font-mono">{r.receipt || '-'}</td>
                  <td>
                    {r.paid ? (
                      <button className="btn-card-wa" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => dispatchWhatsAppReceipt(r)}>
                        💬 Dispatch Receipt
                      </button>
                    ) : (
                      <button className="btn-card-wa" style={{ padding: '4px 8px', fontSize: '0.78rem', opacity: 0.7 }} onClick={() => dispatchWhatsAppReceipt(r)}>
                        💬 Send Reminder
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
