import React, { useRef } from 'react';
import { DURGA_IMAGE_BASE64 } from './durga_b64';

function ReceiptView({ profile, payment, onClose }) {
  const printRef = useRef(null);

  if (!payment) return null;

  const receiptNum = payment.receipt_number || `GGOFA-2026-F${profile.flat_number}-DEMO`;
  const paymentDate = payment.date || new Date().toLocaleDateString();
  const amount = payment.amount || 2500;
  const transactionRef = payment.transaction_ref || `UPI${Date.now()}`;
  const mode = payment.mode || 'UPI';

  function numberToWords(num) {
    if (num === 2500) return 'Two Thousand Five Hundred Rupees Only';
    if (num === 5000) return 'Five Thousand Rupees Only';
    if (num === 10000) return 'Ten Thousand Rupees Only';
    return `${num} Rupees Only`;
  }

  function shareOnWhatsApp() {
    const text = `🪔 *GGOFA DURGA PUJA COMMITTEE 2026* 🪔\n` +
      `*OFFICIAL PAYMENT RECEIPT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *Receipt No:* ${receiptNum}\n` +
      `🏢 *Flat No:* ${profile.flat_number} (Phase ${profile.phase}, Block ${profile.block})\n` +
      `👤 *Owner:* ${profile.owner_name}\n` +
      `💰 *Amount Paid:* ₹${amount}/-\n` +
      `💳 *Mode:* ${mode} (Txn: ${transactionRef})\n` +
      `📅 *Date:* ${paymentDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Status:* Payment Verified & Official Receipt Issued!\n` +
      `🌺 *May Maa Durga Bless You and Your Family!*`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal-content">
        <div className="receipt-actions-top no-print">
          <button className="btn-gold" onClick={handlePrint}>
            🖨️ Print / Download PDF
          </button>
          <button className="btn-whatsapp" onClick={shareOnWhatsApp}>
            📱 Send via WhatsApp
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              ✖ Close
            </button>
          )}
        </div>

        {/* Printable Official Receipt Certificate */}
        <div className="receipt-card printable-area" ref={printRef}>
          {/* Guaranteed Inline Base64 Maa Durga Background Watermark */}
          <div className="watermark-container">
            <img src={DURGA_IMAGE_BASE64} alt="Maa Durga Watermark" className="durga-watermark-img" />
          </div>

          <div className="receipt-header">
            <div className="header-logo-title">
              <img src={DURGA_IMAGE_BASE64} alt="Maa Durga Logo" className="durga-header-logo" />
              <div>
                <h1 className="committee-title">GGOFA DURGA PUJA COMMITTEE</h1>
                <h2 className="event-subtitle">DURGA PUJA 2026 OFFICIAL CONTRIBUTION RECEIPT</h2>
                <p className="reg-info">Society Registration & Contribution Portal</p>
              </div>
            </div>
            <div className="receipt-badge-status">
              VERIFIED ✅
            </div>
          </div>

          <hr className="header-divider" />

          <div className="receipt-meta-grid">
            <div className="meta-box">
              <span className="label">RECEIPT NUMBER</span>
              <span className="value highlight">{receiptNum}</span>
            </div>
            <div className="meta-box">
              <span className="label">PAYMENT DATE</span>
              <span className="value">{paymentDate}</span>
            </div>
            <div className="meta-box">
              <span className="label">PAYMENT MODE</span>
              <span className="value">{mode}</span>
            </div>
            <div className="meta-box">
              <span className="label">TRANSACTION REF</span>
              <span className="value">{transactionRef}</span>
            </div>
          </div>

          <div className="resident-details-box">
            <h3 className="box-heading">RESIDENT & CONTRIBUTION DETAILS</h3>
            <table className="receipt-table">
              <tbody>
                <tr>
                  <td className="td-label">Flat Number:</td>
                  <td className="td-val font-bold">FLAT {profile.flat_number}</td>
                  <td className="td-label">Phase / Block:</td>
                  <td className="td-val">Phase {profile.phase} | Block {profile.block}</td>
                </tr>
                <tr>
                  <td className="td-label">Owner Name:</td>
                  <td className="td-val font-bold">{profile.owner_name}</td>
                  <td className="td-label">Contact No:</td>
                  <td className="td-val">{profile.contact}</td>
                </tr>
                <tr>
                  <td className="td-label">Contribution Amount:</td>
                  <td className="td-val amount-tag" colSpan="3">
                    ₹{amount} /- <span className="words">({numberToWords(amount)})</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="blessing-banner">
            <p>🌺 <i>"Sarva Mangala Mangalye Shive Sarvartha Sadhike, Sharanye Tryambake Gauri Narayani Namostute"</i> 🌺</p>
            <p className="sub-blessing">May Goddess Durga Bless You and Your Family with Peace, Health & Prosperity!</p>
          </div>

          <div className="receipt-footer">
            <div className="qr-badge">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(receiptNum)}`} alt="QR Verification" />
              <span>Scan to Verify</span>
            </div>
            
            <div className="seal-box">
              <div className="committee-stamp">
                <span>GGOFA</span>
                <small>PUJA 2026</small>
                <span>SEAL</span>
              </div>
              <p className="auth-signature">Authorized Signatory</p>
              <p className="auth-committee">GGOFA Durga Puja Committee 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptView;
