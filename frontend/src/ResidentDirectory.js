import React, { useState, useEffect } from 'react';
import { api } from './api';

function ResidentDirectory() {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, PAID, UNPAID
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResidents();
  }, [search]);

  async function loadResidents() {
    setLoading(true);
    try {
      const data = await api.getResidents(search);
      setResidents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = residents.filter(r => {
    if (filter === 'PAID') return r.has_paid;
    if (filter === 'UNPAID') return !r.has_paid;
    return true;
  });

  function openWhatsAppResident(res) {
    const statusMsg = res.has_paid ? 
      `Namaste ${res.owner_name} ji (Flat ${res.flat_number}), thank you for contributing ₹${res.payment?.amount || 500} to GGOFA Durga Puja 2026! Receipt No: ${res.payment?.receipt_number}` :
      `Namaste ${res.owner_name} ji (Flat ${res.flat_number}), GGOFA Durga Puja 2026 celebrations are coming soon! Please register and complete your Puja contribution.`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(statusMsg)}`, '_blank');
  }

  return (
    <div className="directory-container">
      <div className="directory-header glass-card">
        <div>
          <h2>🏢 GGOFA Resident & Owner Directory</h2>
          <p>Official Society Members List — Durga Puja 2026</p>
        </div>
        <div className="directory-stats">
          <span className="stat-pill total">Total Flats: {residents.length}</span>
          <span className="stat-pill paid">Paid: {residents.filter(r => r.has_paid).length}</span>
          <span className="stat-pill pending">Pending: {residents.filter(r => !r.has_paid).length}</span>
        </div>
      </div>

      <div className="search-filter-bar glass-card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Flat No (e.g. 3D, 1A), Owner Name, or Contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="clear-btn" onClick={() => setSearch('')}>✖</button>}
        </div>

        <div className="filter-buttons">
          <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>
            All ({residents.length})
          </button>
          <button className={filter === 'PAID' ? 'active paid' : ''} onClick={() => setFilter('PAID')}>
            Paid ✅ ({residents.filter(r => r.has_paid).length})
          </button>
          <button className={filter === 'UNPAID' ? 'active unpaid' : ''} onClick={() => setFilter('UNPAID')}>
            Pending ⏳ ({residents.filter(r => !r.has_paid).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="diya-loader">🪔</div>
          <p>Loading GGOFA Resident Directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card">
          <p>No residents found matching "{search}".</p>
        </div>
      ) : (
        <div className="resident-grid">
          {filtered.map((r, idx) => (
            <div key={r.flat_number || idx} className={`resident-card glass-card 3d-tilt ${r.has_paid ? 'status-paid' : 'status-unpaid'}`}>
              <div className="card-top">
                <span className="flat-badge">Flat {r.flat_number}</span>
                <span className="location-badge">Phase {r.phase} • Block {r.block}</span>
                <span className={`payment-tag ${r.has_paid ? 'tag-paid' : 'tag-pending'}`}>
                  {r.has_paid ? 'PAID ₹' + (r.payment?.amount || 500) : 'PENDING'}
                </span>
              </div>

              <div className="card-body">
                <h3 className="owner-title">{r.owner_name}</h3>
                <p className="contact-text">
                  📞 <span>{r.contact || 'Contact not updated'}</span>
                </p>
                {r.payment && (
                  <div className="receipt-snippet">
                    <small>Receipt: {r.payment.receipt_number}</small>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button className="btn-card-wa" onClick={() => openWhatsAppResident(r)}>
                  💬 Notify via WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResidentDirectory;
