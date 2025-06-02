import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Fetchtask from "./pages/FetchTaskPage";
import CalendarPage from "./pages/CalendarPage";
import NotificationPage from "./pages/NotificationPage";
import AIPage from "./pages/AIPage";
import CommandPalette from "./components/CommandPalette";
import Toast from "./components/Toast";
import SettingsPage from "./pages/SettingsPage";
import AddTaskModal from './components/AddTaskModal';

import { getDB } from "./db/initDB";
// You can add more pages like AddTask, FetchTask, DeleteTask as needed.


function AppRoutes() {
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/notification" element={<NotificationPage />} />
      <Route path="/fetch-task" element={<Fetchtask />} />
      <Route path="/ai" element={<AIPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

// a component that handles UI state, modals, FABs, and renders your main routes.
// AppWithRoutes is just a helper/component used inside the main App function.
function AppWithRoutes() 
{
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });
  const navigate = useNavigate();

  const showToast = useCallback((message, type = "info") => {
    setToast({ open: true, message, type });
  }, []);

  const handleCommand = useCallback((action) => {
    if (action === "add-task") {
      navigate('/ai');
    } else if (action === "ai-assistant") {
      navigate('/ai');
    } else if (action === "toggle-theme") {
      const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      showToast(`Switched to ${theme} mode`, "info");
    } else if (action === "dashboard") navigate("/home");
    else if (action === "settings") navigate("/settings");
    else navigate("/" + action);
    if (typeof action === "string" && action !== "toggle-theme") showToast(`Command: ${action.replace("-", " ")}`, "info");
  }, [navigate, showToast]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        showToast("Command palette opened (Ctrl/Cmd+K)", "info");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        navigate('/ai');
        showToast("AI Assistant toggled (Ctrl/Cmd+J)", "info");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, showToast]);

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onCommand={handleCommand} />
      <AddTaskModal open={addTaskModalOpen} onClose={() => setAddTaskModalOpen(false)} onSubmit={async (task) => {
        // Placeholder for the removed createTaskAndEmbedding function
      }} />
      <div style={{ position: 'fixed', right: '2.2rem', bottom: '90px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '1.1rem', alignItems: 'flex-end' }}>
        <button
          className="fab fab-quickadd"
          title="Add Task"
          onClick={() => setAddTaskModalOpen(true)}
          style={{ width: 44, height: 44, borderRadius: 12, boxShadow: '0 0 12px 2px #1da1f288, 0 2px 8px #1da1f244', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: '#fff', color: '#1da1f2', border: 'none', marginBottom: 8 }}
        >
          ＋
        </button>
        <button
          className="fab fab-ai"
          title="Go to AI Assistant"
          onClick={() => navigate('/ai')}
          style={{ width: 44, height: 44, borderRadius: 12, boxShadow: '0 0 12px 2px #1da1f288, 0 2px 8px #1da1f244', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
        >
          🤖
        </button>
      </div>
      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ open: false, message: "", type: "info" })} />
      <AppRoutes />
    </>
  );
}

// entry point for this file when imported elesewhere in main.jsx
export default function App() {

  useEffect( () => {
    getDB().then(() => {
      console.log("DB initialized and schema created");
    }).catch(err => {
      console.error("DB init error", err);
    });
  }, []);

  return (

    //  React Router component that enables routing within the app.
    <Router>
      <AppWithRoutes />
    </Router>

  );

}