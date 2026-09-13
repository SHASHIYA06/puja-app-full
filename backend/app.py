from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
from functools import wraps
import datetime
from fpdf import FPDF
from io import BytesIO
import csv
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ggofa_durga_puja.db')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'GGOFA_DURGA_PUJA_2026_SECRET')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app)

COMMITTEE_NAME = "GGOFA Durga Puja Committee"
EVENT_NAME = "DURGA PUJA 2026"

class Resident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sl = db.Column(db.String(10))
    phase = db.Column(db.String(10))
    block = db.Column(db.String(10))
    flat_number = db.Column(db.String(20), unique=True)
    owner_name = db.Column(db.String(150))
    contact = db.Column(db.String(100))
    email = db.Column(db.String(120), default='')
    password = db.Column(db.String(255), nullable=False, default='')

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    amount = db.Column(db.Integer, default=500)
    payment_mode = db.Column(db.String(30), default='UPI')
    payment_date = db.Column(db.String(30))
    receipt_number = db.Column(db.String(50), unique=True)
    transaction_ref = db.Column(db.String(100), default='')

class FoodCoupon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    num_coupons = db.Column(db.Integer, default=1)
    issued_date = db.Column(db.String(30))
    is_collected = db.Column(db.Boolean, default=False)
    coupon_code = db.Column(db.String(50))

with app.app_context():
    db.create_all()

def seed_owners():
    with app.app_context():
        if Resident.query.count() > 0:
            return
        seed_path = os.path.join(os.path.dirname(__file__), "owners_seed.csv")
        if not os.path.exists(seed_path):
            return
        with open(seed_path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                flat = row.get("FLAT NO.") or row.get("Flat No.") or row.get("flat_no") or row.get("flat_number")
                if not flat:
                    continue
                flat_str = str(flat).strip()
                if Resident.query.filter_by(flat_number=flat_str).first():
                    continue
                resident = Resident(
                    sl=str(row.get("SL", "")).strip(),
                    phase=str(row.get("PHASE", "")).strip(),
                    block=str(row.get("BLOCK", "")).strip(),
                    flat_number=flat_str,
                    owner_name=str(row.get("OWNER NAME (OWNER & CO-OWNER)", "") or row.get("owner_name", "")).strip(),
                    contact=str(row.get("CONTACT NO./ BACKUP NO.", "") or row.get("contact", "")).strip(),
                    email="",
                    password="",
                )
                db.session.add(resident)
            db.session.commit()

seed_owners()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Authentication token missing'}), 403
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = Resident.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 404
        except Exception as e:
            return jsonify({'message': f'Invalid or expired token: {e}'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/health')
def health():
    return jsonify({
        'status': 'OK',
        'committee': COMMITTEE_NAME,
        'event': EVENT_NAME,
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/api/residents', methods=['GET'])
def get_residents():
    query = request.args.get('search', '').strip().lower()
    residents = Resident.query.all()
    results = []
    for r in residents:
        payment = Payment.query.filter_by(resident_id=r.id).first()
        coupon = FoodCoupon.query.filter_by(resident_id=r.id).first()
        
        match = True
        if query:
            match = (
                query in r.flat_number.lower() or
                query in r.owner_name.lower() or
                query in r.contact.lower() or
                query in r.phase.lower() or
                query in r.block.lower()
            )
        if match:
            results.append({
                'id': r.id,
                'sl': r.sl,
                'phase': r.phase,
                'block': r.block,
                'flat_number': r.flat_number,
                'owner_name': r.owner_name,
                'contact': r.contact,
                'email': r.email,
                'is_registered': bool(r.password),
                'has_paid': bool(payment),
                'payment': {
                    'amount': payment.amount,
                    'mode': payment.payment_mode,
                    'date': payment.payment_date,
                    'receipt_number': payment.receipt_number,
                    'transaction_ref': payment.transaction_ref
                } if payment else None,
                'coupon': {
                    'num_coupons': coupon.num_coupons,
                    'coupon_code': coupon.coupon_code,
                    'issued_date': coupon.issued_date,
                    'is_collected': coupon.is_collected
                } if coupon else None
            })
    return jsonify(results)

@app.route('/first-login', methods=['POST'])
def first_login():
    data = request.json or {}
    flat_num = str(data.get('flat_number', '')).strip()
    owner = str(data.get('owner_name', '')).strip()
    contact = str(data.get('contact', '')).strip()
    email = str(data.get('email', '')).strip()
    password = str(data.get('password', '')).strip()

    if not flat_num or not password:
        return jsonify({'message': 'Flat number and password are required.'}), 400

    r = Resident.query.filter_by(flat_number=flat_num).first()
    if not r:
        return jsonify({'message': f'Flat {flat_num} not found in official resident directory.'}), 404

    if r.password:
        return jsonify({'message': 'Flat is already registered. Please login.'}), 400

    r.email = email
    r.password = bcrypt.generate_password_hash(password).decode('utf-8')
    if owner and not r.owner_name:
        r.owner_name = owner
    if contact and not r.contact:
        r.contact = contact

    db.session.commit()
    return jsonify({'message': 'Registration successful! You can now log in.'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    flat_num = str(data.get('flat_number', '')).strip()
    password = str(data.get('password', '')).strip()

    r = Resident.query.filter_by(flat_number=flat_num).first()
    if not r or not r.password or not bcrypt.check_password_hash(r.password, password):
        return jsonify({'message': 'Invalid flat number or password.'}), 401

    token = jwt.encode({
        'user_id': r.id,
        'flat_number': r.flat_number,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        'token': token,
        'user': {
            'id': r.id,
            'flat_number': r.flat_number,
            'owner_name': r.owner_name,
            'contact': r.contact,
            'email': r.email,
            'phase': r.phase,
            'block': r.block
        }
    })

@app.route('/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    payment = Payment.query.filter_by(resident_id=current_user.id).first()
    coupon = FoodCoupon.query.filter_by(resident_id=current_user.id).first()
    return jsonify({
        'id': current_user.id,
        'flat_number': current_user.flat_number,
        'owner_name': current_user.owner_name,
        'contact': current_user.contact,
        'email': current_user.email,
        'phase': current_user.phase,
        'block': current_user.block,
        'payment': {
            'amount': payment.amount,
            'mode': payment.payment_mode,
            'date': payment.payment_date,
            'receipt_number': payment.receipt_number,
            'transaction_ref': payment.transaction_ref
        } if payment else None,
        'coupon': {
            'num_coupons': coupon.num_coupons,
            'coupon_code': coupon.coupon_code,
            'issued_date': coupon.issued_date,
            'is_collected': coupon.is_collected
        } if coupon else None
    })

@app.route('/user/payment', methods=['POST'])
@token_required
def record_payment(current_user):
    data = request.json or {}
    existing = Payment.query.filter_by(resident_id=current_user.id).first()
    if existing:
        return jsonify({'message': 'Payment has already been recorded.', 'receipt_number': existing.receipt_number}), 200

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    receipt_num = f"GGOFA-2026-F{current_user.flat_number}-{int(datetime.datetime.now().timestamp())}"
    
    p = Payment(
        resident_id=current_user.id,
        amount=int(data.get('amount', 500)),
        payment_mode=data.get('mode', 'UPI'),
        payment_date=now_str,
        receipt_number=receipt_num,
        transaction_ref=data.get('transaction_ref', f"UPI{int(datetime.datetime.now().timestamp())}")
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({
        'message': 'Payment recorded successfully!',
        'receipt_number': p.receipt_number,
        'amount': p.amount,
        'payment_date': p.payment_date
    })

@app.route('/user/coupon', methods=['POST'])
@token_required
def request_coupon(current_user):
    data = request.json or {}
    p = Payment.query.filter_by(resident_id=current_user.id).first()
    if not p:
        return jsonify({'message': 'Payment required before issuing Durga Puja Bhog coupons.'}), 403
    
    existing = FoodCoupon.query.filter_by(resident_id=current_user.id).first()
    if existing:
        return jsonify({
            'message': 'Food coupon already issued.',
            'num_coupons': existing.num_coupons,
            'coupon_code': existing.coupon_code
        })

    code = f"BHOG-2026-{current_user.flat_number}-{int(datetime.datetime.now().timestamp()) % 10000}"
    c = FoodCoupon(
        resident_id=current_user.id,
        num_coupons=int(data.get('num_coupons', 1)),
        issued_date=datetime.datetime.now().strftime("%Y-%m-%d"),
        is_collected=False,
        coupon_code=code
    )
    db.session.add(c)
    db.session.commit()
    return jsonify({
        'message': 'Durga Puja Food Coupon Issued!',
        'num_coupons': c.num_coupons,
        'coupon_code': c.coupon_code
    })

@app.route('/user/receipt/<receipt_number>')
def download_receipt(receipt_number):
    p = Payment.query.filter_by(receipt_number=receipt_number).first()
    if not p:
        return jsonify({'message': 'Receipt not found'}), 404

    current_user = Resident.query.get(p.resident_id)
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, COMMITTEE_NAME, ln=True, align='C')
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 8, f"OFFICIAL PAYMENT RECEIPT - {EVENT_NAME}", ln=True, align='C')
    pdf.ln(5)

    pdf.set_font("Arial", size=11)
    pdf.cell(0, 8, f"Receipt No: {p.receipt_number}", ln=True)
    pdf.cell(0, 8, f"Date: {p.payment_date}", ln=True)
    pdf.cell(0, 8, f"Flat Number: {current_user.flat_number}", ln=True)
    pdf.cell(0, 8, f"Owner Name: {current_user.owner_name}", ln=True)
    pdf.cell(0, 8, f"Phase: {current_user.phase}  |  Block: {current_user.block}", ln=True)
    pdf.cell(0, 8, f"Contact: {current_user.contact}", ln=True)
    pdf.cell(0, 8, f"Payment Mode: {p.payment_mode}", ln=True)
    pdf.cell(0, 8, f"Transaction Ref: {p.transaction_ref}", ln=True)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, f"Contribution Amount: Rs. {p.amount}/-", ln=True)
    pdf.ln(5)
    
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(0, 8, "May Goddess Durga Bless You and Your Family with Peace, Health & Prosperity!", ln=True, align='C')
    pdf.cell(0, 6, "GGOFA Durga Puja Committee 2026 - Authorized Seal & Signature", ln=True, align='C')

    stream = BytesIO()
    pdf.output(stream)
    stream.seek(0)
    return send_file(stream, download_name=f"{p.receipt_number}.pdf", as_attachment=True)

@app.route('/admin/summary')
def admin_summary():
    residents = Resident.query.all()
    total_residents = len(residents)
    total_paid = 0
    total_amount = 0
    total_coupons = 0
    list_data = []

    for r in residents:
        payment = Payment.query.filter_by(resident_id=r.id).first()
        coupon = FoodCoupon.query.filter_by(resident_id=r.id).first()
        if payment:
            total_paid += 1
            total_amount += payment.amount
        if coupon:
            total_coupons += coupon.num_coupons

        list_data.append({
            'flat': r.flat_number,
            'owner': r.owner_name,
            'phase': r.phase,
            'block': r.block,
            'contact': r.contact,
            'paid': bool(payment),
            'amount': payment.amount if payment else 0,
            'receipt': payment.receipt_number if payment else None,
            'transaction_ref': payment.transaction_ref if payment else None,
            'coupons': coupon.num_coupons if coupon else 0,
            'coupon_code': coupon.coupon_code if coupon else None
        })

    return jsonify({
        'total_residents': total_residents,
        'total_paid': total_paid,
        'total_unpaid': total_residents - total_paid,
        'total_amount': total_amount,
        'total_coupons': total_coupons,
        'residents': list_data
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
