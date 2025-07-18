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
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gurukul_grande.db'
app.config['SECRET_KEY'] = 'SUPER_SECRET_KEY_KEEP_CHANGING'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app)

class Resident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sl = db.Column(db.String(10))
    phase = db.Column(db.String(10))
    block = db.Column(db.String(10))
    flat_number = db.Column(db.String(10), unique=True)
    owner_name = db.Column(db.String(120))
    contact = db.Column(db.String(80))
    email = db.Column(db.String(120), unique=False)
    password = db.Column(db.String(255), nullable=False, default='')  # Ensure blank for "first login"

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    amount = db.Column(db.Integer)
    payment_mode = db.Column(db.String(25))
    payment_date = db.Column(db.String(30))
    receipt_number = db.Column(db.String(40))

class FoodCoupon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    num_coupons = db.Column(db.Integer)
    issued_date = db.Column(db.String(30))
    is_collected = db.Column(db.Boolean, default=False)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(255))

db.create_all()

def seed_owners():
    # Avoid double-seed
    if Resident.query.count() > 0:
        return
    with open("owners_seed.csv", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Defensive: Normalize header keys (remove spaces, upper/lower)
            flat_number = row.get("FLAT NO.") or row.get("Flat No.") or row.get("flat_no") or row.get("flat_number")
            if not flat_number:
                continue
            if Resident.query.filter_by(flat_number=flat_number).first():
                continue
            resident = Resident(
                sl=row.get("SL", ""),
                phase=row.get("PHASE", ""),
                block=row.get("BLOCK", ""),
                flat_number=flat_number.strip(),
                owner_name=row.get("OWNER NAME (OWNER & CO-OWNER)", ""),
                contact=str(row.get("CONTACT NO./ BACKUP NO.", "")).strip(),
                email="",   # Can be updated during first login/registration
                password="", # Blank means not set yet
            )
            db.session.add(resident)
        db.session.commit()

seed_owners()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token missing'}), 403
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = Resident.query.get(data['user_id'])
        except Exception as e:
            return jsonify({'message': f'Invalid token: {e}'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/first-login', methods=['POST'])
def first_login():
    """Set email and password for first time, after verifying flat and owner/contact."""
    data = request.json
    # Find matching resident
    r = Resident.query.filter_by(flat_number=data['flat_number']).first()
    if not r:
        return jsonify({'message': 'Flat not found'}), 404
    # Basic check: Owner or contact matches
    if not (data['owner_name'].strip().lower() in r.owner_name.lower() or data['contact'] in r.contact):
        return jsonify({'message': 'Owner/contact mismatch, please check your details!'}), 400
    if r.password:
        return jsonify({'message': 'Already registered, please login!'}), 400
    r.email = data['email']
    r.password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Registered successfully. Now you can log in.'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    r = Resident.query.filter_by(flat_number=data['flat_number']).first()
    if not r or not r.password or not bcrypt.check_password_hash(r.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    token = jwt.encode({'user_id': r.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
                       app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({'token': token})

@app.route('/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'flat_number': current_user.flat_number,
        'owner_name': current_user.owner_name,
        'contact': current_user.contact,
        'email': current_user.email,
        'phase': current_user.phase,
        'block': current_user.block,
    })

@app.route('/user/payment', methods=['POST'])
@token_required
def record_payment(current_user):
    data = request.json
    if Payment.query.filter_by(resident_id=current_user.id).first():
        return jsonify({'message': 'Payment already recorded'}), 403
    p = Payment(
        resident_id=current_user.id,
        amount=data.get('amount', 500),
        payment_mode=data.get('mode', 'UPI'),
        payment_date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        receipt_number="GDGP{}{}".format(current_user.flat_number, int(datetime.datetime.now().timestamp()))
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({'message': 'Payment recorded', 'receipt_number': p.receipt_number})

@app.route('/user/receipt/<receipt_number>')
@token_required
def get_receipt(current_user, receipt_number):
    p = Payment.query.filter_by(receipt_number=receipt_number, resident_id=current_user.id).first()
    if not p:
        return jsonify({'message': 'Receipt not found'}), 404
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, "Durga Puja Payment Receipt", ln=True, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, f"Flat: {current_user.flat_number}", ln=True)
    pdf.cell(200, 10, f"Owner: {current_user.owner_name}", ln=True)
    pdf.cell(200, 10, f"Contact: {current_user.contact}", ln=True)
    pdf.cell(200, 10, f"Amount: ₹{p.amount}", ln=True)
    pdf.cell(200, 10, f"Date: {p.payment_date}", ln=True)
    pdf.cell(200, 10, f"Receipt #: {p.receipt_number}", ln=True)
    stream = BytesIO()
    pdf.output(stream)
    stream.seek(0)
    return send_file(stream, download_name=f"receipt_{p.receipt_number}.pdf", as_attachment=True)

@app.route('/user/coupon', methods=['POST'])
@token_required
def request_coupon(current_user):
    data = request.json
    p = Payment.query.filter_by(resident_id=current_user.id).first()
    if not p:
        return jsonify({'message': 'You must pay before requesting coupons!'}), 403
    c = FoodCoupon(resident_id=current_user.id, num_coupons=data.get('num_coupons', 1),
                   issued_date=datetime.datetime.now().strftime("%Y-%m-%d"), is_collected=False)
    db.session.add(c)
    db.session.commit()
    return jsonify({'message': "Coupons issued.", 'num_coupons': c.num_coupons})

@app.route('/admin/summary')
def admin_summary():
    residents = Resident.query.all()
    result = []
    for r in residents:
        payment = Payment.query.filter_by(resident_id=r.id).first()
        coupon = FoodCoupon.query.filter_by(resident_id=r.id).first()
        result.append({
            "flat": r.flat_number, "owner": r.owner_name, "paid": bool(payment),
            "receipt": payment.receipt_number if payment else None,
            "num_coupons": coupon.num_coupons if coupon else 0
        })
    return jsonify(result)

@app.route('/health')
def health():
    return "OK"

if __name__ == '__main__':
    # For Cloud Run: host='0.0.0.0', port=8080
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)), debug=True)
