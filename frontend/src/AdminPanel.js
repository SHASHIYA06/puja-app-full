import React, { useState, useEffect } from 'react';
import { api } from './api';

function AdminPanel() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

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

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="diya-loader">🪔</div>
        <p>Loading GGOFA Admin Committee Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header glass-card">
        <div>
          <h2>👑 GGOFA Committee Admin Dashboard</h2>
          <p>DURGA PUJA 2026 Financial & Accounts Audit</p>
        </div>
        <button className="btn-gold" onClick={exportCSV}>
          📥 Export Excel/CSV Audit Report
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-card gold-glow">
          <span className="metric-icon">💰</span>
          <div>
            <h3 className="metric-num">₹{summary?.total_amount || 0}</h3>
            <p className="metric-label">Total Funds Collected</p>
          </div>
        </div>

        <div className="metric-card glass-card green-glow">
          <span className="metric-icon">✅</span>
          <div>
            <h3 className="metric-num">{summary?.total_paid || 0} / {summary?.total_residents || 116}</h3>
            <p className="metric-label">Flats Paid (Verified)</p>
          </div>
        </div>

        <div className="metric-card glass-card orange-glow">
          <span className="metric-icon">⏳</span>
          <div>
            <h3 className="metric-num">{summary?.total_unpaid || 0}</h3>
            <p className="metric-label">Flats Pending</p>
          </div>
        </div>

        <div className="metric-card glass-card purple-glow">
          <span className="metric-icon">🍛</span>
          <div>
            <h3 className="metric-num">{summary?.total_coupons || 0}</h3>
            <p className="metric-label">Bhog Coupons Issued</p>
          </div>
        </div>
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
                <th>Bhog Coupons</th>
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
                  <td>{r.coupons ? `🎟️ ${r.coupons}` : '-'}</td>
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
