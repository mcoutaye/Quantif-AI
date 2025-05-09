from flask import Flask, request, jsonify
import flask_cors
import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt
import os

app = Flask(__name__)

# Activation de CORS
flask_cors.CORS(app, resources={r"/analyze": {"origins": "*"}})  # Permet toutes les origines sur le chemin "/analyze"

# Dossier où les fichiers seront stockés temporairement
UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier fourni'}), 400

    file = request.files['file']
    print(request.files)
    if file.filename == '':
        return jsonify({'error': 'Le fichier est vide ou a un nom invalide'}), 400

    # Enregistrer le fichier temporairement
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    try:
        # Charger les données
        df = pd.read_excel(filepath)

        # Préparation pour Prophet
        df_prophet = df.rename(columns={
            "Date": "ds",
            "Poids total produit (kg)": "y",
            "Température (°C)": "temp",
            "Nombre de clients": "clients",
            "Commandes": "commandes",
            "Personnel présent": "staff"
        })
        df_prophet = df_prophet[["ds", "y", "temp", "clients", "commandes", "staff"]]

        # Initialisation et régressions
        model = Prophet()
        model.add_regressor("temp")
        model.add_regressor("clients")
        model.add_regressor("commandes")
        model.add_regressor("staff")
        model.fit(df_prophet)

        # Données futures (30 jours)
        future_dates = pd.date_range(start=df_prophet["ds"].max() + pd.Timedelta(days=1), periods=30)
        future_df = pd.DataFrame({
            "ds": future_dates,
            "temp": [16]*30,
            "clients": [310]*30,
            "commandes": [520]*30,
            "staff": [15]*30
        })

        # Prédiction
        forecast = model.predict(future_df)

        # Ratios des produits
        ratios = {
            "Burger buns": 0.20,
            "Burger meat": 0.25,
            "Fries": 0.30,
            "Drinks": 0.10,
            "Others": 0.15
        }

        # Générer les colonnes par produit
        detailed_rows = []
        for i, row in forecast.iterrows():
            base = row["yhat"]
            detail = {"Date": row["ds"].date(), "Total (kg)": round(base, 2)}
            for name, ratio in ratios.items():
                detail[name] = round(base * ratio, 2)
            detailed_rows.append(detail)

        # Export vers Excel
        output_filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'Prévision_Produits_30Jours.xlsx')
        pd.DataFrame(detailed_rows).to_excel(output_filepath, index=False)

        # Retourner les recommandations
        recommended_stock = round(forecast["yhat"].iloc[0] * 1.1)
        recommended_staff = max(1, int(forecast["yhat"].iloc[0] // 50))

        return jsonify({
            'stock': recommended_stock,
            'staff': recommended_staff,
            'output_file': output_filepath
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
