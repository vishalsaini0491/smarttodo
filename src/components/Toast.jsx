import React, { useEffect } from "react";
import "../styles/Toast.css";

export default function Toast({ open, message, type = "info", onClose }) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(onClose, 3200);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite" onClick={onClose}>
      {message}
    </div>
  );
} 