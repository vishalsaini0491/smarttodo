import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../pages/Layout";
import "../styles/HomePageStyle.css";
import { getAllTasks, getWeeklyParentTaskCount, getTodayParentTaskCount } from "../db/queries";
import { FaSun, FaMoon, FaUserCircle } from "react-icons/fa";

// --- ICONS ---
const FetchIcon = () => (
  <svg className="homepage-action-icon" width="22" height="22" fill="none">
    <rect x="3" y="6" width="16" height="10" rx="3" fill="#fff" stroke="#fff" strokeWidth="0"/>
    <rect x="3" y="6" width="16" height="10" rx="3" stroke="#7F4F24" strokeWidth="0"/>
    <path d="M8 12h8M8 9h8" stroke="#7F4F24" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="7" cy="10.5" r="1" fill="#7F4F24" />
    <circle cx="7" cy="13.5" r="1" fill="#7F4F24"/>
    <rect x="3" y="6" width="16" height="10" rx="3" stroke="#7F4F24" strokeWidth="2" opacity="0.40"/>
  </svg>
);

const DeleteIcon = () => (
  <svg className="homepage-action-icon" width="22" height="22" fill="none">
    <rect x="5" y="7" width="12" height="10" rx="2" fill="#fff" stroke="#7F4F24" strokeWidth="0"/>
    <path d="M8 10v4M11 10v4M14 10v4" stroke="#7F4F24" strokeWidth="2" strokeLinecap="round"/>
    <rect x="5" y="7" width="12" height="10" rx="2" stroke="#7F4F24" strokeWidth="2" opacity="0.40"/>
    <path d="M3 7h16" stroke="#7F4F24" strokeWidth="2" strokeLinecap="round" opacity="0.40"/>
    <path d="M8 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#7F4F24" strokeWidth="2" opacity="0.40"/>
  </svg>
);

const MOTIVATIONAL_QUOTES = [
  "Code is like humor. When you have to explain it, it's bad.",
  "Simplicity is the soul of efficiency.",
  "The best way to get a project done faster is to start sooner.",
  "First, solve the problem. Then, write the code.",
  "Productivity is never an accident."
];

const StatCard = ({ label, value, valueColor }) => (
  <div className="homepage-stat-card" style={{ borderColor: '#e3e6ea' }}>
    <div className="homepage-stat-value" style={{ color: valueColor }}>{value}</div>
    <div className="homepage-stat-label" style={{ color: '#666' }}>{label}</div>
  </div>
);

const MiniCalendar = React.forwardRef((props, ref) => {
  const today = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = today.getDate();
  const day = days[today.getDay()];
  const month = months[today.getMonth()];
  return (
    <div
      ref={ref}
      className="homepage-mini-calendar"
      tabIndex={0}
      aria-label={`Today is ${day}, ${month} ${date}`}
      style={{
        outline: 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5em 1.2em',
        gap: 4,
        background: 'var(--color-bg-alt)',
        borderRadius: 18,
        boxShadow: '0 2px 12px #1da1f233',
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        minWidth: 70,
        minHeight: 80
      }}
    >
      <div
        className="homepage-mini-calendar-month"
        style={{
          color: '#111',
          fontWeight: 700,
          fontSize: '0.95rem',
          marginBottom: 2,
          letterSpacing: 0.5,
        }}
      >
        {month}
      </div>
      <div
        className="homepage-mini-calendar-day"
        style={{
          color: '#111',
          fontWeight: 500,
          fontSize: '0.85rem',
          marginBottom: 2,
        }}
      >
        {day}
      </div>
      <div
        className="homepage-mini-calendar-date bounce-in"
        style={{
          color: '#111',
          fontWeight: 800,
          fontSize: 'clamp(2em, 5vw, 3.5em)',
          letterSpacing: 1,
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {date}
      </div>
    </div>
  );
});

const MotivationalQuoteWidget = React.forwardRef((props, ref) => {
  const [quote, setQuote] = React.useState("");
  React.useEffect(() => {
    const stored = localStorage.getItem("userQuote") || "Success is the sum of small efforts, repeated.";
    setQuote(stored);
  }, []);
  return (
    <div
      ref={ref}
      className="homepage-quote-widget card"
      style={{
        minWidth: 0,
        background: 'var(--color-bg-alt)',
        borderRadius: 18,
        boxShadow: '0 2px 12px #1da1f233',
        padding: '1.5em 1.2em',
        color: '#1da1f2',
        fontWeight: 500,
        fontSize: '1.08rem',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 64,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontSize: 28, fontWeight: 900, color: '#1da1f2', marginRight: 10, fontStyle: 'normal' }}>&ldquo;</span>
      <span style={{ flex: 1 }}>{quote}</span>
      <span style={{ fontSize: 28, fontWeight: 900, color: '#1da1f2', marginLeft: 10, fontStyle: 'normal' }}>&rdquo;</span>
    </div>
  );
});

const WeatherWidget = ({ minHeight }) => {
  // Dummy weather data for now
  const temp = '27°C';
  const desc = 'Sunny';
  return (
    <div className="homepage-weather-widget-modern" style={{ marginTop: 12, background: '#f7fafd', borderRadius: 14, boxShadow: '0 2px 12px #1da1f233', padding: '0.8em 1em', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight }}>
      <span className="homepage-weather-icon" role="img" aria-label="weather" style={{ fontSize: 28 }}>☀️</span>
      <span className="homepage-weather-temp-modern" style={{ fontSize: 22, fontWeight: 900, color: '#1da1f2', marginRight: 6 }}>{temp}</span>
      <span className="homepage-weather-desc-modern" style={{ fontSize: 15, color: '#7fd7fa', fontWeight: 600 }}>{desc}</span>
    </div>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [name] = useState("Developer"); // Replace with user profile if available
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const quoteRef = useRef(null);
  const [quoteHeight, setQuoteHeight] = useState(100);
  const miniCalRef = useRef(null);
  const [miniCalHeight, setMiniCalHeight] = useState(80);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const user_id = 1; // single user
        const [tasksData, weekCount, todayCount] = await Promise.all([
          getAllTasks(user_id),
          getWeeklyParentTaskCount(user_id),
          getTodayParentTaskCount(user_id)
        ]);
        setTasks(tasksData || []);
        setWeeklyCount(weekCount || 0);
        setTodayCount(todayCount || 0);
      } catch (err) {
        setTasks([]);
        setWeeklyCount(0);
        setTodayCount(0);
      }
      setLoading(false);
    }
    fetchData();
    const interval = setInterval(() => {
      setQuoteIdx(idx => (idx + 1) % MOTIVATIONAL_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (quoteRef.current) {
      setQuoteHeight(quoteRef.current.offsetHeight);
    }
  }, [quoteRef, quoteIdx]);

  useEffect(() => {
    if (miniCalRef.current) {
      setMiniCalHeight(miniCalRef.current.offsetHeight);
    }
  }, [miniCalRef, quoteIdx]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const pendingTasks = tasks.filter(t => t.status !== "Completed").length;
  const upcomingTasks = tasks
    .filter(t => t.status !== "Completed")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);
  const focusTask = tasks
    .filter(t => t.status !== "Completed")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  // Greeting
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Hello";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  // Productivity bar logic
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const completedToday = tasks.filter(t => t.status === "Completed" && t.due_date && t.due_date.startsWith(todayStr)).length;
  const totalToday = tasks.filter(t => t.due_date && t.due_date.startsWith(todayStr)).length;
  const progress = totalToday ? Math.round((completedToday / totalToday) * 100) : 0;

  // Streak tracker (placeholder logic: count consecutive days with at least one completed task)
  function getStreak(tasks) {
    let streak = 0;
    let date = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = date.toISOString().split("T")[0];
      if (tasks.some(t => t.status === "Completed" && t.due_date && t.due_date.startsWith(dateStr))) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }
  const streak = getStreak(tasks);

  const weatherCardSpacing = 12; // px, matches marginTop
  const weatherCardHeight = Math.max(40, quoteHeight - miniCalHeight - weatherCardSpacing);

  return (
    <Layout>
      <div className="app-container">
        <div className="homepage-section homepage-greeting-row">
          <div className="homepage-profile-avatar" style={{ margin: '0 auto' }}>
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=dev" alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          </div>
          <div className="homepage-greeting" style={{ color: '#23242a', fontWeight: 800, fontSize: '1.18rem', marginBottom: 4 }}> {greeting}, {name}! </div>
        </div>
        <div className="homepage-section homepage-widgets-row" style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ flex: 1, maxWidth: '48%', display: 'flex', flexDirection: 'column' }}>
            <MiniCalendar ref={miniCalRef} hasTasksToday={totalToday > 0} />
            <WeatherWidget minHeight={weatherCardHeight} />
          </div>
          <div style={{ flex: 1, maxWidth: '48%' }}>
            <MotivationalQuoteWidget ref={quoteRef} />
          </div>
        </div>
        <div className="homepage-stats-hint-outer"><span className="homepage-stats-hint">Weekly Stats</span></div>
        <div className="homepage-section homepage-stats-card-group card" style={{ position: 'relative', marginBottom: '4.5vw' }}>
          <div className="homepage-stats-row" style={{ marginBottom: 0 }}>
            <div className="homepage-stat-card-inner">
              <div className="homepage-stat-value" style={{ color: '#1da1f2', fontWeight: 900, fontSize: 24 }}>{loading ? '-' : totalTasks}</div>
              <div className="homepage-stat-label">Total Tasks</div>
            </div>
            <div className="homepage-stat-card-inner">
              <div className="homepage-stat-value" style={{ color: '#4CAF50', fontWeight: 900, fontSize: 24 }}>{loading ? '-' : completedTasks}</div>
              <div className="homepage-stat-label">Completed</div>
            </div>
            <div className="homepage-stat-card-inner">
              <div className="homepage-stat-value" style={{ color: '#FF9800', fontWeight: 900, fontSize: 24 }}>{loading ? '-' : pendingTasks}</div>
              <div className="homepage-stat-label">Pending</div>
            </div>
          </div>
        </div>
        <div className="homepage-section card" style={{ marginBottom: '4.5vw' }}>
          <div className="homepage-section-title" style={{ color: '#23242a', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Today's Progress</div>
          <div className="homepage-productivity-bar-card">
            <div className="homepage-productivity-bar-outer">
              <div className="homepage-productivity-bar-inner" style={{ width: progress + '%' }} />
            </div>
            <div className="homepage-productivity-stats">{completedToday} / {totalToday} tasks completed</div>
          </div>
        </div>
        <div className="homepage-section card" style={{ marginBottom: '4.5vw' }}>
          <div className="homepage-section-title" style={{ color: '#23242a', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Streak</div>
          <div className="homepage-streak-value" style={{ fontSize: 22, fontWeight: 900, color: '#fa812f', display: 'flex', alignItems: 'center', gap: 4 }}>🔥 {streak} day{streak === 1 ? '' : 's'}</div>
        </div>
        <div className="homepage-section" style={{ marginBottom: '4.5vw' }}>
          <div className="homepage-section-title" style={{ color: '#23242a', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Upcoming Tasks</div>
          <div className="homepage-upcoming-list card" style={{ marginBottom: 0, padding: 12 }}>
            {loading ? (
              <div className="homepage-upcoming-empty">Loading...</div>
            ) : upcomingTasks.length === 0 ? (
              <div className="homepage-upcoming-empty">No upcoming tasks! 🎉</div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="homepage-upcoming-card">
                  <div className="homepage-upcoming-title">{task.name}</div>
                  <div className="homepage-upcoming-desc">{task.description}</div>
                  <div className="homepage-upcoming-meta">
                    <span className="homepage-upcoming-date">Due: {task.due_date ? new Date(task.due_date).toLocaleString() : "-"}</span>
                    <span className={`homepage-upcoming-status ${task.status === "Completed" ? "completed" : "pending"}`}>{task.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div style={{ minHeight: '6vw' }} aria-hidden="true"></div>
        <div className="homepage-section">
          <button className="homepage-goto-tasks-btn" onClick={() => navigate("/fetch-task")}>Your tasks are here</button>
          <div style={{ height: '22vh' }} aria-hidden="true"></div>
        </div>
      </div>
    </Layout>
  );
}