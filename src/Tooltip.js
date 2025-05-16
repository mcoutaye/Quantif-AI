import React from "react";
import "./App.css";

export default function Tooltip({ children, content }) {
  return (
    <div className="tooltip-container" style={{ position: "relative", display: "inline-block" }}>
      {children}
      <div
        className="tooltip-content"
        style={{
          visibility: "hidden",
          backgroundColor: "#555",
          color: "#fff",
          textAlign: "left",
          borderRadius: "6px",
          padding: "8px",
          position: "absolute",
          zIndex: 1,
          bottom: "125%",
          left: "50%",
          marginLeft: "-120px",
          width: "240px",
          opacity: 0,
          transition: "opacity 0.3s",
        }}
      >
        {content}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            marginLeft: "-5px",
            borderWidth: "5px",
            borderStyle: "solid",
            borderColor: "#555 transparent transparent transparent",
          }}
        />
      </div>
    </div>
  );
}
