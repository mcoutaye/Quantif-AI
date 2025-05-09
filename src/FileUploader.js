import React from "react";

export default function SalesUploader({ onFileUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        onFileUpload(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor="salesFile">Importer un fichier de ventes :</label>
      <input
        type="file"
        id="salesFile"
        accept=".txt,.csv,.xlsx"
        onChange={handleFileChange}
        style={{ display: "block", marginTop: "0.5rem" }}
      />
    </div>
  );
}