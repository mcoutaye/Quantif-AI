import React, { useState } from "react";
import FileUploader from "./FileUploader";
import axios from "axios";

export default function App() {
  const [salesData, setSalesData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (file) => {
    setSalesData(file);
  };

  const handleAnalyze = async () => {
    if (!salesData) {
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", salesData);

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
    <div style={{ maxWidth: "500px", margin: "2rem auto", fontFamily: "Arial" }}>
      <div style={{ border: "1px solid #ccc", padding: "2rem", borderRadius: "8px" }}>
        <h1 style={{ marginBottom: "1rem" }}>Optimiseur de Commandes</h1>
        <FileUploader onFileUpload={handleFileUpload} />
        <button onClick={handleAnalyze} style={{ padding: "0.5rem 1rem" }} disabled={loading}>
          {loading ? "Analyse en cours..." : "Analyser"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {recommendation && (
          <div style={{ marginTop: "1rem" }}>
            <p>Stock recommandé : <strong>{recommendation.stock}</strong></p>
            <p>Personnel recommandé : <strong>{recommendation.staff}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
