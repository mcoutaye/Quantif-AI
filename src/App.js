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
  const [detailedResults, setDetailedResults] = useState([]);

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
    formData.append("rain", options.ingredients ? "true" : "false");
    formData.append("holiday", options.drinks ? "true" : "false");
    formData.append("promo", options.staff ? "true" : "false");

    try {
      const response = await axios.post("http://localhost:5000/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const results = response.data.detailed_results || [];
      setRecommendation(response.data);
      setDetailedResults(Array.isArray(results) ? results : []);
      
    } catch (err) {
      setError("Une erreur s'est produite lors de l'analyse.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="app-container">
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
                <li><strong>Poids total produit (kg)</strong></li>
                <li><strong>Température (°C)</strong></li>
                <li><strong>Nombre de clients</strong></li>
                <li><strong>Commandes</strong></li>
                <li><strong>Personnel présent</strong></li>
              </ul>
            </div>
          }>
            <h3 className="app-help">📄 Veuillez importer un fichier Excel contenant vos données de production.</h3>
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
              Promotion
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
            <h2>📊 Résultats de l'analyse</h2>
            
            <div className="summary-section">
              <div className="summary-card">
                <h3>Recommandations moyennes</h3>
                <p><strong>Stock moyen recommandé:</strong> {recommendation.stock} kg</p>
                <p><strong>Personnel moyen recommandé:</strong> {recommendation.staff} personnes</p>
              </div>
            </div>
            
            <h3>Détails par jour</h3>
            <div className="results-table-container">
              {Array.isArray(detailedResults) && detailedResults.length > 0 ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total (kg)</th>
                      <th>Pain Burger</th>
                      <th>Viande Burger</th>
                      <th>Frites</th>
                      <th>Boissons</th>
                      <th>Autres</th>
                      <th>Personnel recommandé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedResults.map((row, index) => (
                      <tr key={index}>
                        <td>{row.Date}</td>
                        <td>{row["Total (kg)"]}</td>
                        <td>{row["Pain Burger"]}</td>
                        <td>{row["Viandes Burger"]}</td>
                        <td>{row["Frites"]}</td>
                        <td>{row["Boissons"]}</td>
                        <td>{row["Autres"]}</td>
                        <td>{row["Personnel recommandé"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Aucune donnée détaillée disponible</p>
              )}
            </div>
            
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
              📁 Télécharger les résultats complets
            </button>
          </div>
        </div>
      )}
    </>
  );
}