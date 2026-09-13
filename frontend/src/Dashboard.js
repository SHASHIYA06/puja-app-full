import React, { useState, useEffect } from 'react';
import { api } from './api';
import ReceiptView from './ReceiptView';
import { DURGA_IMAGE_BASE64 } from './durga_b64';

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [customRef, setCustomRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userFlat = localStorage.getItem('ggofa_user_flat') || '';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await api.getProfile(token, userFlat);
      setProfile(data);
    } catch (e) {
      setMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    setIsSubmitting(true);
    setMsg('');
    try {
      const res = await api.recordPayment(token, profile.flat_number, 2500, 'UPI', customRef || `UPI-${Date.now()}`);
      setMsg(`✅ Payment Recorded! Receipt Number: ${res.receipt_number}`);
      setShowQrModal(false);
      await loadProfile();
      setShowReceipt(true);
    } catch (err) {
      setMsg(`❌ ${err.message || 'Error recording payment'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCouponRequest() {
    setIsSubmitting(true);
    setMsg('');
    try {
      const res = await api.requestCoupon(token, profile.flat_number, 1);
      setMsg(`✅ Food Coupon Issued! Code: ${res.coupon_code}`);
      await loadProfile();
    } catch (err) {
      setMsg(`❌ ${err.message || 'Error requesting coupon'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="diya-loader">🪔</div>
        <p>Loading Resident Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Welcome Banner */}
      <div className="welcome-banner glass-card 3d-tilt">
        <div className="banner-left">
          <img src={DURGA_IMAGE_BASE64} alt="Maa Durga" className="banner-durga-img" />
          <div>
            <span className="welcome-tag">WELCOME RESIDENT</span>
            <h2>{profile.owner_name}</h2>
            <p>Flat <strong>{profile.flat_number}</strong> • Phase <strong>{profile.phase}</strong> • Block <strong>{profile.block}</strong></p>
            <p className="sub-contact">📞 {profile.contact || 'Not updated'} | 📧 {profile.email || 'Not updated'}</p>
          </div>
        </div>
        <div className="banner-right">
          <button className="btn-logout" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {msg && <div className={`dashboard-alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Durga Puja Contribution */}
        <div className="dash-card glass-card gold-glow 3d-tilt">
          <div className="card-header">
            <h3>🌺 Durga Puja 2026 Contribution</h3>
            <span className={`status-pill ${profile.payment ? 'status-paid' : 'status-pending'}`}>
              {profile.payment ? 'PAID ✅' : 'PENDING ⏳'}
            </span>
          </div>

          <div className="card-content">
            <div className="amount-display">
              <span className="currency">₹</span>
              <span className="amount">2500</span>
              <span className="note">Minimum Official Contribution per Flat</span>
            </div>

            {profile.payment ? (
              <div className="paid-summary-box">
                <p><strong>Receipt No:</strong> {profile.payment.receipt_number}</p>
                <p><strong>Amount Paid:</strong> ₹{profile.payment.amount || 2500}/-</p>
                <p><strong>Date:</strong> {profile.payment.date}</p>
                <p><strong>Txn Ref:</strong> {profile.payment.transaction_ref}</p>
                
                <div className="paid-actions">
                  <button className="btn-gold" onClick={() => setShowReceipt(true)}>
                    📜 View & Download Official Receipt
                  </button>
                </div>
              </div>
            ) : (
              <div className="unpaid-actions">
                <p className="pay-instruction">Scan GGOFA Official UPI QR code or pay via UPI/Cash</p>
                <div className="btn-group-pay">
                  <button className="btn-gold" onClick={() => setShowQrModal(true)}>
                    📲 Scan UPI QR & Pay ₹2,500
                  </button>
                  <button className="btn-primary" onClick={handlePay} disabled={isSubmitting}>
                    ⚡ Quick Confirm Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Bhog & Food Coupon */}
        <div className="dash-card glass-card purple-glow 3d-tilt">
          <div className="card-header">
            <h3>🍛 Durga Puja Bhog & Food Coupon</h3>
            <span className={`status-pill ${profile.coupon ? 'status-issued' : 'status-pending'}`}>
              {profile.coupon ? 'ISSUED 🎟️' : 'AVAILABLE'}
            </span>
          </div>

          <div className="card-content">
            {profile.coupon ? (
              <div className="coupon-issued-box">
                <div className="coupon-ticket">
                  <div className="ticket-top">
                    <span>GGOFA BHOG COUPON 2026</span>
                    <strong>FLAT {profile.flat_number}</strong>
                  </div>
                  <div className="ticket-body">
                    <h4>{profile.coupon.coupon_code}</h4>
                    <p>Valid for Prasad & Bhog Distribution</p>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(profile.coupon.coupon_code)}`} 
                      alt="Coupon QR" 
                      className="coupon-qr"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="coupon-request-box">
                <p>Registered residents who have completed their Puja contribution (₹2,500) receive official Bhog coupons for Prasad distribution.</p>
                <button 
                  className="btn-purple" 
                  onClick={handleCouponRequest} 
                  disabled={!profile.payment || isSubmitting}
                >
                  {profile.payment ? '🎟️ Request Bhog Coupon' : '⚠️ Pay Contribution First'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-content glass-card">
            <h3>📲 Scan to Pay GGOFA Durga Puja 2026</h3>
            <p>Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM)</p>
            
            <div className="qr-image-wrapper">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('upi://pay?pa=ggofapuja@upi&pn=GGOFA%20Durga%20Puja%20Committee&am=2500&cu=INR')}`} 
                alt="GGOFA UPI QR Code" 
              />
            </div>
            
            <div className="upi-details">
              <p><strong>UPI ID:</strong> ggofapuja@upi</p>
              <p><strong>Contribution Amount:</strong> ₹2,500</p>
            </div>

            <div className="form-group margin-top">
              <label>UPI Transaction Ref / UTR Number (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 329182749102"
                value={customRef}
                onChange={e => setCustomRef(e.target.value)}
              />
            </div>

            <div className="modal-buttons">
              <button className="btn-gold" onClick={handlePay} disabled={isSubmitting}>
                ✅ I Have Completed ₹2,500 Payment
              </button>
              <button className="btn-secondary" onClick={() => setShowQrModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal View */}
      {showReceipt && (
        <ReceiptView 
          profile={profile} 
          payment={profile.payment} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
