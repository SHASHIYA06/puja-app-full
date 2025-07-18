from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import jwt
from functools import wraps
import datetime
from fpdf import FPDF
from io import BytesIO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gurukul_grande.db'
app.config['SECRET_KEY'] = 'supersecretkey'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Models
class Resident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    flat_number = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(255), nullable=False)

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

# Auth decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token missing!'}), 403
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = Resident.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Invalid token!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# User registration
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if Resident.query.filter((Resident.flat_number == data['flat_number']) | (Resident.email == data['email'])).first():
        return jsonify({'message': 'Flat/email already registered'}), 400
    hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    resident = Resident(flat_number=data['flat_number'], name=data['name'],
                        phone=data['phone'], email=data['email'], password=hashed)
    db.session.add(resident)
    db.session.commit()
    return jsonify({'message': 'Registered successfully'}), 201

# User login (returns JWT)
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = Resident.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    token = jwt.encode({'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=48)}, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({'token': token})

# List all flats for admin
@app.route('/admin/flats', methods=['GET'])
def admin_flats():
    flats = Resident.query.all()
    return jsonify([{'flat_number': r.flat_number, 'name': r.name, 'paid': Payment.query.filter_by(resident_id=r.id).first() is not None} for r in flats])

# Submit payment
@app.route('/pay', methods=['POST'])
@token_required
def pay(current_user):
    data = request.json
    payment = Payment.query.filter_by(resident_id=current_user.id).first()
    if payment:
        return jsonify({'message': 'Already paid'})
    payrecord = Payment(
        resident_id=current_user.id,
        amount=data['amount'],
        payment_mode=data['mode'],
        payment_date=datetime.datetime.now().strftime("%d-%m-%Y %H:%M"),
        receipt_number=f"GRK{current_user.flat_number}-{int(datetime.datetime.now().timestamp()) % 10000}"
    )
    db.session.add(payrecord)
    db.session.commit()
    return jsonify({'message': 'Payment recorded', 'receipt_number': payrecord.receipt_number})

# Download receipt (PDF)
@app.route('/receipt/<receipt_number>', methods=['GET'])
@token_required
def receipt(current_user, receipt_number):
    p = Payment.query.filter_by(receipt_number=receipt_number, resident_id=current_user.id).first()
    if not p:
        return jsonify({'message': 'No such receipt'}), 404
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt="Durga Puja Payment Receipt", ln=True, align='C')
    pdf.cell(200, 10, txt=f"Flat: {current_user.flat_number} | Name: {current_user.name}", ln=True)
    pdf.cell(200, 10, txt=f"Amount: Rs. {p.amount}", ln=True)
    pdf.cell(200, 10, txt=f"Date: {p.payment_date}", ln=True)
    pdf.cell(200, 10, txt=f"Receipt #: {p.receipt_number}", ln=True)
    bytes_stream = BytesIO()
    pdf.output(bytes_stream)
    bytes_stream.seek(0)
    return send_file(bytes_stream, download_name=f"receipt_{p.receipt_number}.pdf", as_attachment=True)

# Food coupon request
@app.route('/coupon', methods=['POST'])
@token_required
def request_coupon(current_user):
    data = request.json
    if not Payment.query.filter_by(resident_id=current_user.id).first():
        return jsonify({'message': 'Pay first to request coupon'})
    coupon = FoodCoupon(resident_id=current_user.id, num_coupons=data['num_coupons'],
                        issued_date=datetime.datetime.now().strftime("%d-%m-%Y"), is_collected=False)
    db.session.add(coupon)
    db.session.commit()
    return jsonify({'message': 'Coupon issued'})

# Admin: coupon/payments summary
@app.route('/admin/summary', methods=['GET'])
def admin_summary():
    residents = Resident.query.all()
    summary = []
    for r in residents:
        payment = Payment.query.filter_by(resident_id=r.id).first()
        coupon = FoodCoupon.query.filter_by(resident_id=r.id).first()
        summary.append({
            'flat_number': r.flat_number,
            'name': r.name,
            'paid': payment.amount if payment else 0,
            'coupon': coupon.num_coupons if coupon else 0
        })
    return jsonify(summary)

if __name__ == '__main__':
    app.run(debug=True)
