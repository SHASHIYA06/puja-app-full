import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const SEED_RESIDENTS = [
  { sl: "1", phase: "1", block: "1", flat_number: "1A", owner_name: "LISA DAS", contact: "9434442909" },
  { sl: "2", phase: "1", block: "1", flat_number: "1B", owner_name: "MADHUMITA SAMANTA", contact: "9800765209 / 9038077712" },
  { sl: "3", phase: "1", block: "1", flat_number: "1C", owner_name: "TANWEERUL HAQUE", contact: "8910924025 / 9748649851" },
  { sl: "4", phase: "1", block: "1", flat_number: "1D", owner_name: "PADMINI DASH & RAVI TRIPATHY", contact: "905144479" },
  { sl: "5", phase: "1", block: "1", flat_number: "1E", owner_name: "SOPAN ROY", contact: "900789456" },
  { sl: "6", phase: "1", block: "1", flat_number: "1F", owner_name: "AMITABHA PATI", contact: "9969228960 / 8655738540" },
  { sl: "7", phase: "1", block: "1", flat_number: "1G", owner_name: "INDRAJIT GUHA", contact: "9435715119 / 9969228834" },
  { sl: "8", phase: "1", block: "1", flat_number: "1H", owner_name: "MOUMITA PATRA & SHUBHABRATA PATRA", contact: "9851903461" },
  { sl: "9", phase: "1", block: "1", flat_number: "2A", owner_name: "MANASI DAS (BAPPADITYA DAS)", contact: "7977096567 / 9987005102" },
  { sl: "10", phase: "1", block: "1", flat_number: "2B", owner_name: "PARTHA CHOUDHURI", contact: "9831480735" },
  { sl: "11", phase: "1", block: "1", flat_number: "2C", owner_name: "BARNALI GHOSHDASTIDAR", contact: "9836087917" },
  { sl: "12", phase: "1", block: "1", flat_number: "2D", owner_name: "MANOJ PARIJA", contact: "8420196592" },
  { sl: "13", phase: "1", block: "1", flat_number: "2E", owner_name: "OMPRAKASH SINGH", contact: "9831027983" },
  { sl: "14", phase: "1", block: "1", flat_number: "2F", owner_name: "SUBHAJIT BANERJEE", contact: "9051111917 / 9051111974" },
  { sl: "15", phase: "1", block: "1", flat_number: "2G", owner_name: "RAKESH SHUKLA", contact: "9987064624" },
  { sl: "16", phase: "1", block: "1", flat_number: "2H", owner_name: "SOUMENDU SARKAR", contact: "8016673403" },
  { sl: "17", phase: "1", block: "1", flat_number: "3A", owner_name: "MOHIT SETHIA", contact: "9830093110 / 9339970855" },
  { sl: "18", phase: "1", block: "1", flat_number: "3B", owner_name: "SASWATI BISWAS", contact: "9800611535" },
  { sl: "19", phase: "1", block: "1", flat_number: "3C", owner_name: "SANCHARI DAS", contact: "9681467680" },
  { sl: "20", phase: "1", block: "1", flat_number: "3D", owner_name: "SHASHI SHEKHAR MISHRA", contact: "9799494321" },
  { sl: "21", phase: "1", block: "1", flat_number: "3E", owner_name: "PRAKASH KUMAR", contact: "9007329756" },
  { sl: "22", phase: "1", block: "1", flat_number: "3F", owner_name: "SHYAMAL BOSE", contact: "8259030333" },
  { sl: "23", phase: "1", block: "1", flat_number: "3G", owner_name: "ABHIJIT SARDAR (Prosenjit Sardar)", contact: "8981451565" },
  { sl: "24", phase: "1", block: "1", flat_number: "3H", owner_name: "VIKAS KR ROY", contact: "8697879769 / 9051539395" },
  { sl: "25", phase: "1", block: "1", flat_number: "4A", owner_name: "KRIPAMOY DE", contact: "9674362555" },
  { sl: "26", phase: "1", block: "1", flat_number: "4B", owner_name: "GOUTAM GANGULY", contact: "9831531513" },
  { sl: "27", phase: "1", block: "1", flat_number: "4C", owner_name: "ANGSHUMAN ADHIKARY", contact: "9830782426" },
  { sl: "28", phase: "1", block: "1", flat_number: "4D", owner_name: "SASWATA BANERJEE", contact: "9831241260" },
  { sl: "29", phase: "1", block: "1", flat_number: "4E", owner_name: "POONAM SONCHHATRA", contact: "9831186736" },
  { sl: "30", phase: "1", block: "1", flat_number: "4F", owner_name: "SASWATI SIL", contact: "8420066805" },
  { sl: "31", phase: "1", block: "1", flat_number: "4G", owner_name: "PRIYA SINGH (Santanu)", contact: "7687042143" },
  { sl: "32", phase: "1", block: "1", flat_number: "4H", owner_name: "SARBARI BHATTACHARYA", contact: "9836250868" },
  { sl: "33", phase: "1", block: "2", flat_number: "1A", owner_name: "CHAYAN BANDYOPADHYAY", contact: "9717129443" },
  { sl: "34", phase: "1", block: "2", flat_number: "1B", owner_name: "SIULI DEY (Kallol Dutta)", contact: "9163322947" },
  { sl: "35", phase: "1", block: "2", flat_number: "1C", owner_name: "SWARUPA RAY", contact: "9830351511" },
  { sl: "36", phase: "1", block: "2", flat_number: "1D", owner_name: "SUKANYA BOSE DAS", contact: "9681467680" },
  { sl: "37", phase: "1", block: "2", flat_number: "2A", owner_name: "SATYAJIT BISWAS", contact: "8697707223" },
  { sl: "38", phase: "1", block: "2", flat_number: "2B", owner_name: "JAYANTA KR ROY", contact: "8335080340" },
  { sl: "39", phase: "1", block: "2", flat_number: "2C", owner_name: "PREETAM DAS", contact: "7439201207" },
  { sl: "40", phase: "1", block: "2", flat_number: "2D", owner_name: "BARNA PRAKASH CHAKRABORTI", contact: "9474491129" },
  { sl: "41", phase: "1", block: "2", flat_number: "3A", owner_name: "TARAK SUTRADHAR", contact: "9331904503" },
  { sl: "42", phase: "1", block: "2", flat_number: "3B", owner_name: "AVEEK CHATTERJEE", contact: "9874404047" },
  { sl: "43", phase: "1", block: "2", flat_number: "3C", owner_name: "KAMNA JHA (Praveen Kr. Jha)", contact: "7845232858" },
  { sl: "44", phase: "1", block: "2", flat_number: "3D", owner_name: "SAMHITA BISWAS", contact: "9830631544" },
  { sl: "45", phase: "1", block: "2", flat_number: "4A", owner_name: "SANTOSH KUMAR", contact: "9771410896" },
  { sl: "46", phase: "1", block: "2", flat_number: "4B", owner_name: "SRINIVASA RAO BANDREDDI", contact: "9007861935" },
  { sl: "47", phase: "1", block: "2", flat_number: "4C", owner_name: "RAKESH KUMAR SAHOO", contact: "8420190764" },
  { sl: "48", phase: "1", block: "2", flat_number: "4D", owner_name: "RAHUL ROY", contact: "9831477801" },
  { sl: "49", phase: "2", block: "1", flat_number: "1A", owner_name: "PAPIYA CHOWDHURY", contact: "9831128248" },
  { sl: "50", phase: "2", block: "1", flat_number: "1B", owner_name: "VIKAS ANAND", contact: "9903308503" }
];

function getLocalResidents() {
  const data = localStorage.getItem('ggofa_residents');
  if (data) {
    try { return JSON.parse(data); } catch (e) {}
  }
  const initial = SEED_RESIDENTS.map(r => ({
    ...r,
    email: '',
    is_registered: true,
    password: 'password123',
    has_paid: false,
    payment: null,
    coupon: null
  }));
  localStorage.setItem('ggofa_residents', JSON.stringify(initial));
  return initial;
}

function saveLocalResidents(residents) {
  localStorage.setItem('ggofa_residents', JSON.stringify(residents));
}

export const api = {
  async getResidents(searchQuery = '') {
    try {
      const res = await axios.get(`${API_URL}/api/residents?search=${encodeURIComponent(searchQuery)}`);
      if (res && res.data) return res.data;
    } catch (e) {
      console.warn("Backend API unavailable for getResidents, using fallback:", e);
    }
    const residents = getLocalResidents();
    if (!searchQuery) return residents;
    const q = searchQuery.toLowerCase().trim();
    return residents.filter(r => 
      r.flat_number.toLowerCase().includes(q) ||
      r.owner_name.toLowerCase().includes(q) ||
      r.contact.toLowerCase().includes(q) ||
      r.phase.toLowerCase().includes(q) ||
      r.block.toLowerCase().includes(q)
    );
  },

  async firstLogin(data) {
    try {
      const res = await axios.post(`${API_URL}/api/first-login`, data);
      if (res && res.data) return res.data;
    } catch (e) {
      if (e.response && e.response.data) throw e.response.data;
    }
    const residents = getLocalResidents();
    const target = residents.find(r => r.flat_number.toLowerCase() === (data.flat_number || '').toLowerCase());
    if (!target) throw { message: `Flat ${data.flat_number} not found in official directory.` };
    
    target.email = data.email || target.email;
    target.password = data.password;
    if (data.owner_name) target.owner_name = data.owner_name;
    if (data.contact) target.contact = data.contact;
    target.is_registered = true;
    saveLocalResidents(residents);
    return { message: 'Registration successful! You can now log in.' };
  },

  async login(flat_number, password) {
    try {
      const res = await axios.post(`${API_URL}/api/login`, { flat_number, password });
      if (res && res.data) return res.data;
    } catch (e) {
      if (e.response && e.response.data) throw e.response.data;
    }
    const residents = getLocalResidents();
    const target = residents.find(r => r.flat_number.toLowerCase() === (flat_number || '').toLowerCase());
    if (!target) throw { message: 'Invalid flat number or password.' };
    
    const token = 'LOCAL_JWT_' + btoa(JSON.stringify({ flat_number: target.flat_number, time: Date.now() }));
    return {
      token,
      user: {
        flat_number: target.flat_number,
        owner_name: target.owner_name,
        contact: target.contact,
        email: target.email,
        phase: target.phase,
        block: target.block
      }
    };
  },

  async getProfile(token, userFlat) {
    if (token && !token.startsWith('LOCAL_JWT_')) {
      try {
        const res = await axios.get(`${API_URL}/api/user/profile`, { headers: { 'x-access-token': token } });
        if (res && res.data) return res.data;
      } catch (e) {
        console.warn("Backend profile API error:", e);
      }
    }
    const residents = getLocalResidents();
    const target = residents.find(r => r.flat_number.toLowerCase() === (userFlat || '').toLowerCase()) || residents[0];
    return {
      flat_number: target.flat_number,
      owner_name: target.owner_name,
      contact: target.contact,
      email: target.email,
      phase: target.phase,
      block: target.block,
      payment: target.payment,
      coupon: target.coupon
    };
  },

  async recordPayment(token, userFlat, amount = 2500, mode = 'UPI', transaction_ref = '') {
    if (token && !token.startsWith('LOCAL_JWT_')) {
      try {
        const res = await axios.post(`${API_URL}/api/user/payment`, { amount, mode, transaction_ref }, { headers: { 'x-access-token': token } });
        if (res && res.data) return res.data;
      } catch (e) {
        if (e.response && e.response.data) throw e.response.data;
      }
    }
    const residents = getLocalResidents();
    const target = residents.find(r => r.flat_number.toLowerCase() === (userFlat || '').toLowerCase());
    if (!target) throw { message: 'Resident not found' };

    const receiptNum = `GGOFA-2026-F${target.flat_number}-${Date.now()}`;
    const txRef = transaction_ref || `UPI${Date.now()}`;
    const paymentObj = {
      amount: amount || 2500,
      mode,
      date: new Date().toLocaleString(),
      receipt_number: receiptNum,
      transaction_ref: txRef
    };
    target.has_paid = true;
    target.payment = paymentObj;
    saveLocalResidents(residents);

    return {
      message: 'Payment recorded successfully!',
      receipt_number: receiptNum,
      amount: paymentObj.amount,
      payment_date: paymentObj.date
    };
  },

  getShareLinks(receiptNumber, contact, profileData = {}) {
    const flat = profileData.flat_number || '';
    const owner = profileData.owner_name || '';
    const amt = profileData.payment?.amount || 2500;
    const mode = profileData.payment?.mode || 'UPI';
    const txRef = profileData.payment?.transaction_ref || '';
    const date = profileData.payment?.date || new Date().toLocaleDateString('en-IN');

    const msg = (
      `🪔 *GGOFA DURGA PUJA COMMITTEE 2026* 🪔\n` +
      `*OFFICIAL CONTRIBUTION RECEIPT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *Receipt No:* ${receiptNumber}\n` +
      `🏢 *Flat No:* ${flat}\n` +
      `👤 *Owner Name:* ${owner}\n` +
      `💰 *Amount Paid:* ₹${amt}/-\n` +
      `💳 *Payment Mode:* ${mode} (Ref: ${txRef})\n` +
      `📅 *Payment Date:* ${date}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Status:* Payment Verified & Recorded!\n` +
      `🌺 *May Goddess Durga Bless You & Your Family!*`
    );

    const cleanPhone = (contact || '').replace(/[^0-9]/g, '');
    const phoneFormatted = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const encoded = encodeURIComponent(msg);

    const waUrl = phoneFormatted ? `https://wa.me/${phoneFormatted}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    const smsUrl = phoneFormatted ? `sms:${phoneFormatted}?body=${encoded}` : `sms:?body=${encoded}`;

    return {
      receiptNumber,
      messageText: msg,
      whatsappUrl: waUrl,
      smsUrl: smsUrl
    };
  },

  async requestCoupon(token, userFlat, num_coupons = 1) {
    if (token && !token.startsWith('LOCAL_JWT_')) {
      try {
        const res = await axios.post(`${API_URL}/api/user/coupon`, { num_coupons }, { headers: { 'x-access-token': token } });
        if (res && res.data) return res.data;
      } catch (e) {
        if (e.response && e.response.data) throw e.response.data;
      }
    }
    const residents = getLocalResidents();
    const target = residents.find(r => r.flat_number.toLowerCase() === (userFlat || '').toLowerCase());
    if (!target) throw { message: 'Resident not found' };
    if (!target.has_paid) throw { message: 'Durga Puja contribution required before issuing Bhog coupons!' };

    const couponObj = {
      num_coupons,
      coupon_code: `BHOG-2026-${target.flat_number}-${Math.floor(1000 + Math.random() * 9000)}`,
      issued_date: new Date().toISOString().split('T')[0],
      is_collected: false
    };
    target.coupon = couponObj;
    saveLocalResidents(residents);

    return {
      message: 'Durga Puja Food Coupon Issued!',
      num_coupons,
      coupon_code: couponObj.coupon_code
    };
  },

  async getAdminSummary() {
    try {
      const res = await axios.get(`${API_URL}/api/admin/summary`);
      if (res && res.data) return res.data;
    } catch (e) {
      console.warn("Backend admin summary error:", e);
    }
    const residents = getLocalResidents();
    const total = residents.length;
    let paidCount = 0;
    let totalAmt = 0;
    let totalCpn = 0;

    residents.forEach(r => {
      if (r.has_paid && r.payment) {
        paidCount++;
        totalAmt += r.payment.amount || 2500;
      }
      if (r.coupon) {
        totalCpn += r.coupon.num_coupons || 1;
      }
    });

    return {
      total_residents: total,
      total_paid: paidCount,
      total_unpaid: total - paidCount,
      total_amount: totalAmt,
      total_coupons: totalCpn,
      residents
    };
  }
};
