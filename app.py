from flask import Flask, jsonify, request, send_from_directory
from data_loader import DataLoader
from datetime import datetime

app = Flask(__name__, static_url_path='/static')
fx_data_loader = DataLoader()


@app.route('/')
def serve_frontend():
    """
    Serve the main frontend HTML file.
    """
    return send_from_directory('static', 'index.html')


@app.route('/currencies', methods=['GET'])
def get_currencies():
    """
    Returns the list of available currencies from the dataset.
    """
    currencies = fx_data_loader.load_data().columns.tolist()  # Get all currency codes
    return jsonify({'currencies': currencies}), 200


@app.route('/fxrate', methods=['GET'])
def get_fx_rate():
    """
    Returns the FX rate(s) for a given currency and a single date or range of dates.
    """
    currency = request.args.get('currency')
    date = request.args.get('date')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')

    if not currency:
        return jsonify({'error': 'Currency is a required parameter'}), 400

    if date:
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

        rate = fx_data_loader.get_rate(date_obj, currency.upper())

        if rate is None:
            return jsonify({'error': f'Rate not found for {currency} on {date}'}), 404

        return jsonify({'currency': currency, 'date': date, 'rate': rate}), 200

    elif start_date and end_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

        if start_date_obj > end_date_obj:
            return jsonify({'error': 'start_date cannot be after end_date'}), 400

        rates = fx_data_loader.get_rates_range(start_date_obj, end_date_obj, currency.upper())

        if not rates:
            return jsonify(
                {'error': f'No rates found for {currency} in the date range {start_date} to {end_date}'}), 404

        return jsonify({
            'currency': currency,
            'start_date': start_date,
            'end_date': end_date,
            'rates': rates
        }), 200

    else:
        return jsonify({'error': 'Either date or both start_date and end_date are required'}), 400


if __name__ == '__main__':
    app.run(debug=True)
