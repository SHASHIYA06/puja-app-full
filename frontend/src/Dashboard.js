import React, { useState, useEffect } from 'react';
import { api } from './api';
import ReceiptView from './ReceiptView';
import { DURGA_IMAGE_BASE64 } from './durga_b64';
import { translations } from './i18n';

function Dashboard({ token, lang = 'EN', onLogout }) {
  const t = translations[lang] || translations.EN;
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAutoShareModal, setShowAutoShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [customRef, setCustomRef] = useState('');
  const [customAmount, setCustomAmount] = useState(2500);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form selectors
  const [selectedPhase, setSelectedPhase] = useState('1');
  const [selectedBlock, setSelectedBlock] = useState('1');

  // Food Coupon Order Form State
  const [foodSelection, setFoodSelection] = useState({
    saptamiVeg: 0,
    saptamiNonVeg: 0,
    astami: 0,
    navamiVeg: 0,
    navamiNonVeg: 0,
    dashamiVeg: 0,
    dashamiNonVeg: 0
  });

  const userFlat = localStorage.getItem('ggofa_user_flat') || '';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await api.getProfile(token, userFlat);
      setProfile(data);
      if (data.phase) setSelectedPhase(data.phase);
      if (data.block) setSelectedBlock(data.block);
    } catch (e) {
      setMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  }

  function updateFoodQty(key, delta) {
    setFoodSelection(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + delta)
    }));
  }

  async function handlePay() {
    setIsSubmitting(true);
    setMsg('');
    try {
      const res = await api.recordPayment(token, profile.flat_number, customAmount, paymentMode, customRef || `UPI-${Date.now()}`);
      setMsg(`✅ Payment Recorded! Receipt Number: ${res.receipt_number}`);
      setShowQrModal(false);
      
      const updatedProfile = await api.getProfile(token, profile.flat_number);
      setProfile(updatedProfile);

      // Generate Auto Share Links
      const links = api.getShareLinks(res.receipt_number, updatedProfile.contact, updatedProfile);
      setShareData(links);
      setShowAutoShareModal(true);
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
      const totalCoupons = Object.values(foodSelection).reduce((a, b) => a + b, 0) || 1;
      const res = await api.requestCoupon(token, profile.flat_number, totalCoupons);
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
        <p>Loading Dashboard...</p>
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
            <span className="welcome-tag">{t.headerSubtitle}</span>
            <h2>{profile.owner_name}</h2>
            <p>
              {t.unitNumber}: <strong>FLAT {profile.flat_number}</strong> • {t.phase}: <strong>{selectedPhase}</strong> • {t.block}: <strong>{selectedBlock}</strong>
            </p>
            <p className="sub-contact">📞 {profile.contact || 'N/A'} | 📧 {profile.email || 'N/A'}</p>
          </div>
        </div>
        <div className="banner-right">
          <button className="btn-logout" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {msg && <div className={`dashboard-alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Durga Puja Contribution & UPI Details */}
        <div className="dash-card glass-card gold-glow 3d-tilt">
          <div className="card-header">
            <h3>{t.contributionTitle}</h3>
            <span className={`status-pill ${profile.payment ? 'status-paid' : 'status-pending'}`}>
              {profile.payment ? 'PAID ✅' : 'PENDING ⏳'}
            </span>
          </div>

          <div className="card-content">
            <div className="amount-display">
              <span className="currency">₹</span>
              <span className="amount">{profile.payment ? profile.payment.amount : 2500}</span>
              <span className="note">{t.minContribution}</span>
            </div>

            {/* Official ICICI UPI Payment Box with Copy Button */}
            <div className="icici-upi-card">
              <h4>🏦 Official Bank & UPI Details</h4>
              <div className="copy-row">
                <span><strong>{t.upiIdLabel}</strong> <code className="highlight-code">eazypay.ntb1100085519@icici</code></span>
                <button className="btn-copy" onClick={() => copyToClipboard('eazypay.ntb1100085519@icici')}>
                  {copiedUpi ? 'Copied! ✅' : '📋 Copy'}
                </button>
              </div>
              <p style={{ marginTop: '8px' }}><strong>{t.accountLabel}</strong> <code>XXXXXXXXXX0039</code></p>
              <p><strong>{t.beneficiaryLabel}</strong> Gurukul Durga Puja Committee</p>
            </div>

            {profile.payment ? (
              <div className="paid-summary-box">
                <p><strong>{t.receiptNo}</strong> {profile.payment.receipt_number}</p>
                <p><strong>{t.amount}</strong> ₹{profile.payment.amount || 2500}/-</p>
                <p><strong>{t.date}</strong> {profile.payment.date}</p>
                <p><strong>{t.paymentMode}</strong> {profile.payment.mode}</p>
                
                <div className="paid-actions margin-top" style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-gold" onClick={() => setShowReceipt(true)}>
                    {t.viewReceipt}
                  </button>
                  <button className="btn-whatsapp" onClick={() => {
                    const links = api.getShareLinks(profile.payment.receipt_number, profile.contact, profile);
                    window.open(links.whatsappUrl, '_blank');
                  }}>
                    📱 Share WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <div className="unpaid-actions margin-top">
                <div className="form-group margin-bottom">
                  <label>{t.paymentMode}</label>
                  <select 
                    value={paymentMode} 
                    onChange={e => setPaymentMode(e.target.value)}
                    className="styled-select"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>

                <div className="btn-group-pay">
                  <button className="btn-gold" onClick={() => setShowQrModal(true)}>
                    {t.scanUpiPay}
                  </button>
                  <button className="btn-primary" onClick={handlePay} disabled={isSubmitting}>
                    {t.quickConfirm}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Bhog & Food Coupon Booking System */}
        <div className="dash-card glass-card purple-glow 3d-tilt">
          <div className="card-header">
            <h3>{t.bhogTitle}</h3>
            <span className={`status-pill ${profile.coupon ? 'status-issued' : 'status-pending'}`}>
              {profile.coupon ? 'ISSUED 🎟️' : 'BOOKING OPEN'}
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
                    <p>Valid for Saptami - Dashami Prasad & Bhog</p>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(profile.coupon.coupon_code)}`} 
                      alt="Coupon QR" 
                      className="coupon-qr"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="food-booking-form">
                <p className="sub-instruction">Select Bhog Coupons for Puja Days:</p>

                <div className="food-day-row">
                  <span>Saptami Veg (₹200):</span>
                  <div className="qty-counter">
                    <button className="qty-btn" onClick={() => updateFoodQty('saptamiVeg', -1)}>-</button>
                    <span>{foodSelection.saptamiVeg}</span>
                    <button className="qty-btn" onClick={() => updateFoodQty('saptamiVeg', 1)}>+</button>
                  </div>
                </div>

                <div className="food-day-row">
                  <span>Saptami Non-Veg (₹280):</span>
                  <div className="qty-counter">
                    <button className="qty-btn" onClick={() => updateFoodQty('saptamiNonVeg', -1)}>-</button>
                    <span>{foodSelection.saptamiNonVeg}</span>
                    <button className="qty-btn" onClick={() => updateFoodQty('saptamiNonVeg', 1)}>+</button>
                  </div>
                </div>

                <div className="food-day-row">
                  <span>Astami Bhog (₹180):</span>
                  <div className="qty-counter">
                    <button className="qty-btn" onClick={() => updateFoodQty('astami', -1)}>-</button>
                    <span>{foodSelection.astami}</span>
                    <button className="qty-btn" onClick={() => updateFoodQty('astami', 1)}>+</button>
                  </div>
                </div>

                <div className="food-day-row">
                  <span>Navami Non-Veg (₹280):</span>
                  <div className="qty-counter">
                    <button className="qty-btn" onClick={() => updateFoodQty('navamiNonVeg', -1)}>-</button>
                    <span>{foodSelection.navamiNonVeg}</span>
                    <button className="qty-btn" onClick={() => updateFoodQty('navamiNonVeg', 1)}>+</button>
                  </div>
                </div>

                <div className="food-day-row">
                  <span>Dashami Non-Veg (₹290):</span>
                  <div className="qty-counter">
                    <button className="qty-btn" onClick={() => updateFoodQty('dashamiNonVeg', -1)}>-</button>
                    <span>{foodSelection.dashamiNonVeg}</span>
                    <button className="qty-btn" onClick={() => updateFoodQty('dashamiNonVeg', 1)}>+</button>
                  </div>
                </div>

                <button 
                  className="btn-purple margin-top" 
                  onClick={handleCouponRequest} 
                  disabled={!profile.payment || isSubmitting}
                >
                  {profile.payment ? t.requestBhog : '⚠️ Complete Payment First'}
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
            <h3>{t.upiDetailsTitle}</h3>
            <p>Scan with Google Pay, PhonePe, Paytm, BHIM</p>
            
            <div className="qr-image-wrapper">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('upi://pay?pa=eazypay.ntb1100085519@icici&pn=Gurukul%20Durga%20Puja%20Committee&am=2500&cu=INR')}`} 
                alt="ICICI UPI QR Code" 
              />
            </div>
            
            <div className="upi-details">
              <p><strong>UPI ID:</strong> eazypay.ntb1100085519@icici</p>
              <p><strong>Contribution Amount:</strong> ₹2,500</p>
              <p><strong>Beneficiary:</strong> Gurukul Durga Puja Committee</p>
            </div>

            <div className="form-group margin-top">
              <label>Transaction / UTR Reference No (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 329182749102"
                value={customRef}
                onChange={e => setCustomRef(e.target.value)}
              />
            </div>

            <div className="modal-buttons">
              <button className="btn-gold" onClick={handlePay} disabled={isSubmitting}>
                ✅ {t.quickConfirm}
              </button>
              <button className="btn-secondary" onClick={() => setShowQrModal(false)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Auto Receipt Transfer & Dispatch Modal */}
      {showAutoShareModal && shareData && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-content glass-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ color: '#10B981' }}>🎉 Payment Confirmed & Verified!</h3>
            <p>Official Receipt <strong>{shareData.receiptNumber}</strong> has been generated.</p>
            
            <div className="share-box-content margin-top margin-bottom">
              <p style={{ fontSize: '0.85rem', color: '#D1C7BD', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '10px', whiteSpace: 'pre-line' }}>
                {shareData.messageText}
              </p>
            </div>

            <div className="modal-buttons">
              <button 
                className="btn-whatsapp" 
                onClick={() => window.open(shareData.whatsappUrl, '_blank')}
              >
                💬 Dispatch via WhatsApp ({profile.contact || 'Owner'})
              </button>

              <button 
                className="btn-primary" 
                onClick={() => window.open(shareData.smsUrl, '_blank')}
              >
                📱 Send via SMS
              </button>

              <button 
                className="btn-gold" 
                onClick={() => {
                  setShowAutoShareModal(false);
                  setShowReceipt(true);
                }}
              >
                📜 Print / View Certificate
              </button>

              <button 
                className="btn-secondary" 
                onClick={() => setShowAutoShareModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {showReceipt && (
        <ReceiptView 
          profile={profile} 
          payment={profile.payment}
          lang={lang} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
