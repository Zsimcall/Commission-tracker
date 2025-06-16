from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import re
from datetime import datetime
import csv
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///commissions.db'
db = SQLAlchemy(app)

class LineActivation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), nullable=False)
    activation_date = db.Column(db.Date, nullable=True)
    customer = db.Column(db.String(120), nullable=True)
    carrier = db.Column(db.String(50), nullable=True)
    line_description = db.Column(db.String(200), nullable=True)
    commissions = db.relationship('CommissionRecord', backref='line', lazy=True)

class CommissionRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    line_id = db.Column(db.Integer, db.ForeignKey('line_activation.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    commission_type = db.Column(db.String(50), nullable=True)

def extract_phone_number(account_str):
    match = re.match(r"^(\d{10})", account_str)
    return match.group(1) if match else None

@app.route('/summary', methods=['GET'])
def summary():
    from sqlalchemy import func
    total_commission = db.session.query(func.sum(CommissionRecord.amount)).scalar() or 0
    total_lines = db.session.query(LineActivation).count()
    avg_commission = total_commission / total_lines if total_lines else 0
    return jsonify({
        'total_commission': round(total_commission, 2),
        'total_lines': total_lines,
        'average_commission_per_line': round(avg_commission, 2)
    })

@app.route('/lines', methods=['GET'])
def get_lines():
    lines = LineActivation.query.all()
    data = []
    for line in lines:
        total_commission = sum([c.amount for c in line.commissions])
        data.append({
            'phone_number': line.phone_number,
            'activation_date': line.activation_date.strftime('%Y-%m-%d') if line.activation_date else None,
            'customer': line.customer,
            'carrier': line.carrier,
            'line_description': line.line_description,
            'total_commission': round(total_commission, 2)
        })
    return jsonify(data)

@app.route('/import', methods=['POST'])
def import_csv():
    file_path = request.json.get('file_path')
    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': 'Invalid file path'}), 400

    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            phone_number = extract_phone_number(row['ACCOUNT_NUM'])
            if not phone_number:
                continue
            activation_date = datetime.strptime(row['ACTIVATION_DATE'], '%Y-%m-%d').date() if row['ACTIVATION_DATE'] else None
            line = LineActivation(
                phone_number=phone_number,
                activation_date=activation_date,
                customer=row.get('CUSTOMER', ''),
                carrier=row.get('PROVIDER', ''),
                line_description=row.get('LINE_DESC', '')
            )
            db.session.add(line)
            db.session.flush()

            commission = CommissionRecord(
                line_id=line.id,
                date=datetime.strptime(row['CYCLE_DATE'], '%Y-%m-%d').date(),
                amount=float(row['COMP_PAID']) if row['COMP_PAID'] else 0.0,
                commission_type=row.get('NOTE', '')
            )
            db.session.add(commission)

        db.session.commit()

    return jsonify({'message': 'CSV imported successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
