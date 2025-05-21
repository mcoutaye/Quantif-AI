import React, { useState } from "react";
import "./App.css";

// Modifiez votre Tooltip component comme ceci :
export default function Tooltip({ content, children }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div
      className="tooltip-container"
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="tooltip-content"
          style={{
            position: "absolute",
            backgroundColor: "#555",
            color: "#fff",
            textAlign: "left",
            borderRadius: "6px",
            padding: "8px",
            zIndex: 1,
            bottom: "125%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "240px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
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
      )}
    </div>
  );
}