import React, { useState } from "react";
import "./App.css";

export default function FileUploader({ onFileUpload }) {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onFileUpload(file);
    }
  };

  return (
    <div className="file-uploader">
      <label htmlFor="file-upload" className="file-upload-label">
        📁 Choisir un fichier
      </label>
      <input id="file-upload" type="file" onChange={handleFileChange} />
      {fileName && <span className="file-name">{fileName}</span>}
    </div>
  );
}
