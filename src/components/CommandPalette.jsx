import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiSun, FiMoon, FiPlus, FiHome, FiMessageCircle, FiCalendar, FiCheckCircle, FiSettings, FiBell } from "react-icons/fi";
import "../styles/CommandPalette.css";
import { useNavigate } from "react-router-dom";

const COMMANDS = [
  { label: "Go to Dashboard", icon: <FiHome />, action: "dashboard", shortcut: "D" },
  { label: "Add Task", icon: <FiPlus />, action: "add-task", shortcut: "A" },
  { label: "Go to Calendar", icon: <FiCalendar />, action: "calendar", shortcut: "C" },
  { label: "Show Completed Tasks", icon: <FiCheckCircle />, action: "show-completed", shortcut: "S" },
  { label: "Open Notifications", icon: <FiBell />, action: "notification", shortcut: "N" },
  { label: "Open AI Assistant", icon: <FiMessageCircle />, action: "ai-assistant", shortcut: "J" },
  { label: "Open Settings", icon: <FiSettings />, action: "settings", shortcut: "G" },
  { label: "Toggle Theme", icon: <FiSun />, action: "toggle-theme", shortcut: "T" },
];

export default function CommandPalette({ open, onClose, onCommand }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const ref = useRef();
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => ref.current && ref.current.focus(), 100);
    }
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0));
      if (e.key === "Enter" && filtered[selected]) {
        onCommand(filtered[selected].action);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selected, onClose, onCommand]);

  const handleCommand = useCallback((action) => {
    if (action === "add-task") setQuickAddOpen(true);
    else if (action === "ai-assistant") setAIOpen(true);
    else if (action === "toggle-theme") {
      const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
    } else if (action === "dashboard") navigate("/home");
    else if (action === "calendar") navigate("/calendar");
    else if (action === "notification") navigate("/notification");
    else if (action === "show-completed") navigate("/fetch-task?filter=completed");
    else if (action === "settings") showToast("Settings coming soon!", "info");
    else navigate("/" + action);
  }, [navigate]);

  if (!open) return null;
  return (
    <div className="cmdp-overlay" onClick={onClose}>
      <div className="cmdp-modal" onClick={e => e.stopPropagation()}>
        <div className="cmdp-input-wrap">
          <FiSearch className="cmdp-search-icon" />
          <input
            ref={ref}
            className="cmdp-input"
            placeholder="Type a command..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            autoFocus
          />
        </div>
        <ul className="cmdp-list">
          {filtered.length === 0 && <li className="cmdp-empty">No commands found</li>}
          {filtered.map((cmd, i) => (
            <li
              key={cmd.label}
              className={"cmdp-item" + (i === selected ? " selected" : "")}
              onMouseEnter={() => setSelected(i)}
              onClick={() => { onCommand(cmd.action); onClose(); }}
              tabIndex={0}
            >
              <span className="cmdp-icon">{cmd.icon}</span>
              {cmd.label}
              <span className="cmdp-shortcut">{cmd.shortcut}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 