import axios from 'axios';
import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL;

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState({});
  const [paid, setPaid] = useState(false);
  const [receiptNum, setReceiptNum] = useState('');
  const [couponRequested, setCoupon] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get(`${API}/user/profile`, { headers: { 'x-access-token': token } })
    .then(r => setProfile(r.data));
  }, []);

  function pay() {
    axios.post(`${API}/user/payment`, { amount: 500, mode: 'UPI' },
      { headers: { 'x-access-token': token } })
    .then(res => {
      setPaid(true);
      setReceiptNum(res.data.receipt_number);
      setMsg('Payment Recorded! Download Receipt.');
    }).catch(e => setMsg(e.response?.data?.message || 'Error'));
  }

  function downloadReceipt() {
    window.open(`${API}/user/receipt/${receiptNum}`, '_blank');
  }

  function coupon() {
    axios.post(`${API}/user/coupon`, { num_coupons: 1 }, { headers: {'x-access-token': token } })
    .then(() => setCoupon(true)).catch(e => setMsg(e.response?.data?.message || 'Error'));
  }

  return (
    <div style={{maxWidth:'600px',margin:'50px auto',padding:20,background:'#f2faff',borderRadius:10}}>
      <h2>Welcome, {profile.owner_name}</h2>
      <p>Flat: {profile.flat_number} | Block: {profile.block} | Phase: {profile.phase}</p>
      <p>Contact: {profile.contact} | Email: {profile.email}</p>

      <h3>Durga Puja Payment (₹500)</h3>
      <img src="/your_qr.png" width="200" alt="Scan UPI QR"/>
      <div>
        <button onClick={pay} disabled={paid}>I've Paid by QR/UPI</button>
        {paid && <button onClick={downloadReceipt}>Download Receipt</button>}
      </div>
      <br/>

      <h3>Food Coupon</h3>
      <button onClick={coupon} disabled={!paid || couponRequested}>Request Coupon</button>
      {couponRequested && <p className="success">Coupons requested!</p>}

      <br/><button onClick={onLogout}>Logout</button>
      <p>{msg}</p>
    </div>
  );
}
export default Dashboard;
