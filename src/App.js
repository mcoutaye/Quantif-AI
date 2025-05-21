import React, { useState } from "react";
import FileUploader from "./FileUploader";
import Tooltip from "./Tooltip";
import axios from "axios";
import "./App.css";

export default function App() {
  const [salesData, setSalesData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [options, setOptions] = useState({
    ingredients: false,
    drinks: false,
    staff: false,
  });

  const handleFileUpload = (file) => {
    setSalesData(file);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setOptions((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAnalyze = async () => {
    if (!salesData) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", salesData);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);

    // Ici les noms correspondent au backend : rain et holiday
    formData.append("rain", options.ingredients ? "true" : "false");
    formData.append("holiday", options.drinks ? "true" : "false");
    formData.append("promo", options.staff ? "true" : "false"); // si tu veux gérer promo côté backend

    try {
      const response = await axios.post("http://localhost:5000/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRecommendation(response.data);
    } catch (err) {
      setError("Une erreur s'est produite lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="app-container">
        {/* --- Header --- */}
        <header className="app-header">
          <img src="/Logo_Quantifai.png" alt="Logo Quantif'AI" className="logo-image" />
          <h2 className="logo-text">Quantif'AI</h2>
          <div className="header-right"></div>
        </header>

        <div className="app-card">
          <h1 className="app-title">Analyse de données</h1>
          <Tooltip content={
            <div>
              <p>Le fichier doit contenir les colonnes suivantes :</p>
              <ul>
                <li><strong>Date</strong> (format JJ/MM/AAAA)</li>
                <li><strong>Produit</strong> (nom de l'article)</li>
                <li><strong>Quantité vendue</strong></li>
                <li><strong>Prix</strong> (unitaire ou total)</li>
              </ul>
              <p>Voici un exemple :</p>
              <img src="/exemple_excel.png" alt="Exemple de fichier Excel" />
            </div>
          }>
            <h3 className="app-help">📄 Veuillez importer un fichier Excel contenant vos données de ventes.</h3>
          </Tooltip>
          <FileUploader onFileUpload={handleFileUpload} />

          <div className="date-section">
            <label>
              <span>Date de début :</span>
              <br />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              <span>Date de fin :</span>
              <br />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>

          <div className="checkbox-section">
            <label>
              <input
                type="checkbox"
                name="ingredients"
                checked={options.ingredients}
                onChange={handleCheckboxChange}
              />
              Pluie
            </label>
            <label>
              <input
                type="checkbox"
                name="drinks"
                checked={options.drinks}
                onChange={handleCheckboxChange}
              />
              Vacances
            </label>
            <label>
              <input
                type="checkbox"
                name="staff"
                checked={options.staff}
                onChange={handleCheckboxChange}
              />
              Promo
            </label>
          </div>

          <button className="analyze-button" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyse en cours..." : "Analyser"}
          </button>

          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
      {recommendation && (
        <div className="result-container">
          <div className="result-card">
            <h3>📝 Résultat de l'analyse :</h3>
            <button
              className="download-button"
              onClick={() => {
                window.open(
                  `http://localhost:5000/download/${encodeURIComponent(recommendation.output_file)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              📁 Télécharger le fichier
            </button>
          </div>
        </div>
      )}
    </>
  );
}
