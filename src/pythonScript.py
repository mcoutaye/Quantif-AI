from flask import Flask, request, jsonify, send_from_directory
import flask_cors
import pandas as pd
from prophet import Prophet
import os
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
flask_cors.CORS(app, resources={r"/analyze": {"origins": "*"}, r"/download/*": {"origins": "*"}})

UPLOAD_FOLDER = '../uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier fourni'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Le fichier est vide ou a un nom invalide'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    try:
        start_date_str = request.form.get("start_date")
        end_date_str = request.form.get("end_date")

        if not start_date_str or not end_date_str:
            return jsonify({'error': 'Les dates de début et de fin doivent être fournies.'}), 400

        start_date = pd.to_datetime(start_date_str).date()
        end_date = pd.to_datetime(end_date_str).date()

        if end_date < start_date:
            return jsonify({'error': 'La date de fin doit être postérieure ou égale à la date de début.'}), 400

        rain = request.form.get("rain", "false").lower() == "true"
        holiday = request.form.get("holiday", "false").lower() == "true"

        df = pd.read_excel(filepath)
        expected_cols = ["Date", "Poids total produit (kg)", "Température (°C)", "Nombre de clients", "Commandes", "Personnel présent"]
        missing_cols = [col for col in expected_cols if col not in df.columns]
        if missing_cols:
            os.remove(filepath)
            return jsonify({'error': f"Colonnes manquantes dans le fichier : {missing_cols}"}), 400

        df_prophet = df.rename(columns={
            "Date": "ds",
            "Poids total produit (kg)": "y",
            "Température (°C)": "temp",
            "Nombre de clients": "clients",
            "Commandes": "commandes",
            "Personnel présent": "staff"
        })

        df_prophet["ds"] = pd.to_datetime(df_prophet["ds"], dayfirst=True)
        df_prophet = df_prophet.dropna(subset=["ds", "y", "temp", "clients", "commandes", "staff"])

        model = Prophet()
        model.add_regressor("temp")
        model.add_regressor("clients")
        model.add_regressor("commandes")
        model.add_regressor("staff")
        model.fit(df_prophet)

        future_dates = pd.date_range(start=start_date, end=end_date, freq='D')

        base_temp = 16
        base_clients = 310
        base_commandes = 520
        base_staff = 15

        factor_clients = 1.0
        factor_commandes = 1.0
        factor_staff = 1.0
        if rain:
            factor_clients = 0.8
            factor_commandes = 0.8
            factor_staff = 0.8
        if holiday:
            factor_clients = 1.3
            factor_commandes = 1.3
            factor_staff = 1.3

        adjust_factor = factor_clients

        future_df = pd.DataFrame({
            "ds": future_dates,
            "temp": [base_temp] * len(future_dates),
            "clients": [int(base_clients * factor_clients)] * len(future_dates),
            "commandes": [int(base_commandes * factor_commandes)] * len(future_dates),
            "staff": [max(1, int(base_staff * factor_staff))] * len(future_dates)
        })

        forecast = model.predict(future_df)


        ratios = {
            "Burger buns": 0.20,
            "Burger meat": 0.25,
            "Fries": 0.30,
            "Drinks": 0.10,
            "Others": 0.15
        }

        detailed_rows = []
        for _, row in forecast.iterrows():
            base = row["yhat"] * adjust_factor
            detail = {"Date": row["ds"].strftime("%Y-%m-%d"), "Total (kg)": round(base, 2)}
            for name, ratio in ratios.items():
                detail[name] = round((base * ratio), 2)
            detailed_rows.append(detail)

        output_filename = 'Prevision_Produits.xlsx'
        output_filepath = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
        pd.DataFrame(detailed_rows).to_excel(output_filepath, index=False)

        os.remove(filepath)

        recommended_stock = round(forecast["yhat"].iloc[0] * adjust_factor * 1.1)
        recommended_staff = max(1, int((forecast["yhat"].iloc[0] * adjust_factor) // 50))

        return jsonify({
            'stock': recommended_stock,
            'staff': recommended_staff,
            'output_file': output_filename
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    safe_filename = secure_filename(filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'Fichier non trouvé'}), 404
    return send_from_directory(app.config['UPLOAD_FOLDER'], safe_filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
