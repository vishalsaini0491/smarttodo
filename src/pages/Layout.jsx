import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/LayoutStyle.css";
import { FaSun, FaMoon } from "react-icons/fa";

// --- ICONS ---
const BellIcon = ({ accent = "#1da1f2" }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M15 18.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5m8.5-2h-13c-.55 0-1-.45-1-1 0-.29.13-.56.34-.75A7.97 7.97 0 0 0 6 10.5V9c0-3.03 2.16-5.5 6-5.5s6 2.47 6 5.5v1.5c0 1.77.77 3.37 2 4.75.21.19.34.46.34.75 0 .55-.45 1-1 1z" stroke={accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" className={`layout-nav-icon${active ? " active" : ""}`} fill="none">
    <path d="M4 11.5V19a1 1 0 0 0 1 1h3.5V16a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4H19a1 1 0 0 0 1-1v-7.5M3 12.38l8.32-7.4a1.5 1.5 0 0 1 1.95 0l8.32 7.4" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AIIcon = ({ active }) => (
  <svg width="24" height="24" className={`layout-nav-icon${active ? " active" : ""}`} fill="none">
    <circle cx="12" cy="12" r="10" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5"/>
    <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="1.2" fill={active ? "#1da1f2" : "#23242a"}/>
  </svg>
);

const CalendarIcon = ({ active }) => (
  <svg width="24" height="24" className={`layout-nav-icon${active ? " active" : ""}`} fill="none">
    <rect x="3" y="5" width="18" height="16" rx="3" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5"/>
    <path d="M16 3v4M8 3v4M3 9h18" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TasksIcon = ({ active }) => (
  <svg width="24" height="24" className={`layout-nav-icon${active ? " active" : ""}`} fill="none">
    <rect x="4" y="4" width="16" height="16" rx="4" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5"/>
    <path d="M8 9h8M8 13h5" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = ({ active }) => (
  <svg width="24" height="24" className={`layout-nav-icon${active ? " active" : ""}`} fill="none">
    <circle cx="12" cy="12" r="10" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5"/>
    <path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.5"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" stroke={active ? "#1da1f2" : "#23242a"} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    boxShadow: '0 1.5px 8px #1da1f244',
  }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.79A9 9 0 0 1 12.79 3a1 1 0 0 0-1.13 1.36A7 7 0 1 0 19.64 14.34a1 1 0 0 0 1.36-1.13Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  </span>
);

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Theme state
  const [theme, setTheme] = React.useState(() => document.documentElement.getAttribute("data-theme") || "light");
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Responsive main padding
  React.useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      if (window.innerWidth <= 480) {
        main.style.paddingLeft = "0.15rem";
        main.style.paddingRight = "0.15rem";
      } else {
        main.style.paddingLeft = "0.5rem";
        main.style.paddingRight = "0.5rem";
      }
    }
    const handleResize = () => {
      if (main) {
        if (window.innerWidth <= 480) {
          main.style.paddingLeft = "0.15rem";
          main.style.paddingRight = "0.15rem";
        } else {
          main.style.paddingLeft = "0.5rem";
          main.style.paddingRight = "0.5rem";
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // TODO: Replace with real unread notification state from DB
  const hasUnread = true; // Simulate unread notifications for now

  return (
    <div className="layout-root">
      {/* Header */}
      <header className="layout-header">
        <span className="layout-app-name" style={{ marginLeft: '1cm' }}>Taskify</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <button
            className="layout-darkmode-btn"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%', color: theme === 'light' ? '#ffd700' : '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <FaSun /> : <MoonIcon />}
          </button>
          <button
            className="layout-bell-btn"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => navigate("/notification")}
            style={{ position: 'relative', background: 'var(--color-bg)', border: 'none', borderRadius: '50%', boxShadow: '0 2px 12px #1da1f244', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.18s, background 0.18s' }}
          >
            <BellIcon accent="#1da1f2" />
            {hasUnread && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#fa3e3e',
                boxShadow: '0 0 6px #fa3e3e99',
                border: '2px solid var(--color-bg)',
                zIndex: 2,
                pointerEvents: 'none',
              }} />
            )}
          </button>
        </span>
      </header>
      {/* Main */}
      <main
        id="main-content"
        className="layout-main"
      >
        {children}
      </main>
      {/* Footer Navigation */}
      <footer className="layout-footer">
        <div style={{ display: 'flex', flex: 1, width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
          <button
            className={`layout-nav-btn${isActive("/calendar") ? " active" : ""}`}
            onClick={() => navigate("/calendar")}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CalendarIcon active={isActive("/calendar")}/>
              <span className="layout-nav-label">Calendar</span>
            </span>
          </button>
          <button
            className={`layout-nav-btn${isActive("/home") ? " active" : ""}`}
            onClick={() => navigate("/home")}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <HomeIcon active={isActive("/home")}/>
              <span className="layout-nav-label">Home</span>
            </span>
          </button>
          <button
            className={`layout-nav-btn${isActive("/fetch-task") ? " active" : ""}`}
            onClick={() => navigate("/fetch-task")}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <TasksIcon active={isActive("/fetch-task")}/>
              <span className="layout-nav-label">Tasks</span>
            </span>
          </button>
          <button
            className={`layout-nav-btn${isActive("/settings") ? " active" : ""}`}
            onClick={() => navigate("/settings")}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <SettingsIcon active={isActive("/settings")}/>
              <span className="layout-nav-label">Settings</span>
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}