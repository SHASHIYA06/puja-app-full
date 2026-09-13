import React, { useEffect, useRef } from 'react';
import { DURGA_IMAGE_BASE64 } from './durga_b64';
import { translations } from './i18n';

function ReceiptView({ profile, payment, lang = 'EN', onClose }) {
  const printRef = useRef(null);
  const t = translations[lang] || translations.EN;

  const receiptNum = payment?.receipt_number || `GGOFA-2026-F${profile.flat_number || '101'}-${Date.now()}`;
  const receiptDate = payment?.date || new Date().toLocaleDateString('en-IN');
  const amount = payment?.amount || 2500;
  const paymentMode = payment?.mode || 'UPI';
  const name = profile.owner_name || 'Resident';
  const mobile = profile.contact || 'N/A';
  const unit = `Flat ${profile.flat_number || ''} (Phase ${profile.phase || '1'}, Block ${profile.block || '1'})`;

  // Submit to Google Sheet on load / generation
  useEffect(() => {
    if (payment) {
      const googleSheetURL = 'https://script.google.com/macros/s/AKfycbyqu-CQ93cSRsin02Yh15o4M41WmFlM0A0pkhFxbmnaTC_htWIj9RwpafsZ9ZK5Vlm15w/exec';
      const formData = {
        receiptNumber: receiptNum,
        name: name,
        mobile: mobile,
        unit: unit,
        amount: parseFloat(amount).toFixed(2),
        paymentMode: paymentMode,
        date: receiptDate
      };

      fetch(googleSheetURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(err => console.error('Google Sheet Sync Note:', err));
    }
  }, [payment]);

  function handlePrint() {
    const receiptHtml = printRef.current.outerHTML;
    const printWindow = window.open('', '', 'height=750,width=650');
    printWindow.document.write('<html><head><title>GGOFA Durga Puja 2026 Receipt</title>');
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #111; }
        .receipt-card { border: 2px solid #333; padding: 25px; border-radius: 8px; position: relative; max-width: 580px; margin: 0 auto; overflow: hidden; background: #fff; }
        .watermark-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; width: 300px; pointer-events: none; }
        .durga-watermark-img { width: 100%; border-radius: 50%; }
        h2 { text-align: center; color: #800020; margin-bottom: 5px; font-size: 1.4rem; }
        h3 { text-align: center; color: #555; margin-top: 0; font-size: 0.95rem; }
        hr { border: 0; border-top: 1px solid #ccc; margin: 15px 0; }
        p { margin: 8px 0; font-size: 0.95rem; }
        .thank-you { text-align: center; margin-top: 25px; font-style: italic; color: #800020; font-weight: bold; }
        .signature { text-align: right; margin-top: 35px; }
        .signature p { margin: 2px 0; }
        .amount-highlight { font-size: 1.2rem; font-weight: bold; color: #800020; }
        .seal-circle { display: inline-block; border: 2px double #800020; border-radius: 50%; padding: 8px 12px; font-size: 0.7rem; color: #800020; text-align: center; font-weight: bold; transform: rotate(-8deg); }
        .footer-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptHtml);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  function shareOnWhatsApp() {
    const text = `🪔 *GGOFA DURGA PUJA COMMITTEE 2026* 🪔\n` +
      `*OFFICIAL CONTRIBUTION RECEIPT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *Receipt No:* ${receiptNum}\n` +
      `📅 *Date:* ${receiptDate}\n` +
      `👤 *Name:* ${name}\n` +
      `🏢 *Unit:* ${unit}\n` +
      `💰 *Amount:* ₹${amount}/-\n` +
      `💳 *Mode:* ${paymentMode}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Status:* Payment Verified & Recorded!\n` +
      `🌺 *May Goddess Durga Bless You & Your Family!*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal-content">
        <div className="receipt-actions-top no-print">
          <button className="btn-gold" onClick={handlePrint}>
            {t.printReceipt}
          </button>
          <button className="btn-whatsapp" onClick={shareOnWhatsApp}>
            {t.sendWhatsapp}
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              {t.close}
            </button>
          )}
        </div>

        {/* Printable Receipt Card matching exact specification */}
        <div className="receipt-card printable-area" ref={printRef} id="receipt">
          {/* Guaranteed Base64 Maa Durga Background Watermark */}
          <div className="watermark-container">
            <img src={DURGA_IMAGE_BASE64} alt="Maa Durga Watermark" className="durga-watermark-img" />
          </div>

          <h2>{t.receiptTitle}</h2>
          <h3>{t.receiptSubtitle}</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <p><strong>{t.date}</strong> <span>{receiptDate}</span></p>
            <p><strong>{t.receiptNo}</strong> <span>{receiptNum}</span></p>
          </div>
          
          <hr />
          
          <p><strong>{t.name}</strong> <span>{name}</span></p>
          <p><strong>{t.mobileNumber}</strong> <span>{mobile}</span></p>
          <p><strong>{t.unitNumber}</strong> <span>{unit}</span></p>
          <p><strong>{t.amount}</strong> <span className="amount-highlight">₹{amount} /-</span></p>
          <p><strong>{t.paymentMode}</strong> <span>{paymentMode}</span></p>
          
          <hr />
          
          <p className="thank-you">{t.thankYouMsg}</p>
          
          <div className="footer-flex">
            <div className="seal-circle">
              GGOFA PUJA<br/>2026<br/>VERIFIED
            </div>
            
            <div className="signature">
              <p>_________________________</p>
              <p><strong>{t.authorizedSig}</strong></p>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>GGOFA Durga Puja Committee 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptView;
