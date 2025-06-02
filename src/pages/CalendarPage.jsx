import React, { useState, useEffect } from 'react';
import Layout from "../pages/Layout";
import '../styles/CalendarPageStyle.css';
import { FiCalendar } from 'react-icons/fi';
import { getTaskTreeByDate } from '../db/queries';
import { getWeekDates,  handleDayClick, handleMonthYearSelect } from '../utils/calendarHandlers.jsx';

const typeIcon = {
  task: "📝",
  meeting: "👥",
  reminder: "⏰",
  grocery: "🛒",
  work: "💼",
  family: "👪",
  personal: "",
  other: "☑",
};

function getMonthDays(year, month) {
  const result = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  for(let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    result.push(new Date(d));
  }
  return result;
}

export default function CalendarPage() {
  const [calendarView, setCalendarView] = useState(() => localStorage.getItem('calendarView') || 'monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [toast, setToast] = useState("");
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [taskTreeByDate, setTaskTreeByDate] = useState({});

  useEffect(() => {
    localStorage.setItem('calendarView', calendarView);
  }, [calendarView]);

  useEffect(() => {
    const newDate = new Date(year, month, 1);
    setSelectedDate(prev => {
      if (prev.getFullYear() !== year || prev.getMonth() !== month) {
        return newDate;
      }
      return prev;
    });
  }, [month, year]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const tree = await getTaskTreeByDate();
        setTaskTreeByDate(tree);
        console.log("Fetched task tree:", tree);
      } catch (err) {
        setToast("Failed to load calendar tasks");
        console.error("CalendarPage error:", err);
      }
    }
    fetchTasks();
  }, [month, year]);

  if (!taskTreeByDate) return <div>Loading...</div>;

  return (
    <Layout>
      <div className="app-container">
        <div className="calendar-section calendar-topbar" style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ marginLeft: '0.5rem' }}>
            <button
              aria-label="Select month and year"
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1da1f2', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
              onClick={() => setShowMonthYearPicker(v => !v)}
            >
              <FiCalendar style={{ fontSize: 22 }} />
              <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#23242a', minWidth: 90, textAlign: 'center' }}>
                {new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </button>
            {showMonthYearPicker && (
              <div style={{ position: 'absolute', top: 54, left: 0, right: 0, margin: '0 auto', zIndex: 9999, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #1da1f233', padding: '1em 1.2em', maxWidth: 260, width: '95vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 18, width: '100%', justifyContent: 'center' }}>
                  {/* Month selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button aria-label="Previous month" style={{ background: '#f7fafd', color: '#1da1f2', border: 'none', borderRadius: 8, padding: '0.2em 0.7em', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginBottom: 2 }} onClick={() => setMonth(m => m === 0 ? 11 : m - 1)}>&uarr;</button>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#23242a', minWidth: 48, textAlign: 'center', background: '#f7fafd', borderRadius: 8, padding: '0.5em 0.7em', margin: '2px 0', boxShadow: '0 1px 4px #1da1f211' }}>{new Date(year, month).toLocaleString(undefined, { month: 'short' })}</div>
                    <button aria-label="Next month" style={{ background: '#f7fafd', color: '#1da1f2', border: 'none', borderRadius: 8, padding: '0.2em 0.7em', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: 2 }} onClick={() => setMonth(m => m === 11 ? 0 : m + 1)}>&darr;</button>
                  </div>
                  {/* Year selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button aria-label="Previous year" style={{ background: '#f7fafd', color: '#1da1f2', border: 'none', borderRadius: 8, padding: '0.2em 0.7em', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginBottom: 2 }} onClick={() => setYear(y => y - 1)}>&uarr;</button>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#23242a', minWidth: 48, textAlign: 'center', background: '#f7fafd', borderRadius: 8, padding: '0.5em 0.7em', margin: '2px 0', boxShadow: '0 1px 4px #1da1f211' }}>{year}</div>
                    <button aria-label="Next year" style={{ background: '#f7fafd', color: '#1da1f2', border: 'none', borderRadius: 8, padding: '0.2em 0.7em', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: 2 }} onClick={() => setYear(y => y + 1)}>&darr;</button>
                  </div>
                </div>
                <button style={{ marginTop: 10, background: '#fff', color: '#1da1f2', border: '1.2px solid #1da1f2', borderRadius: 8, padding: '0.4em 1.2em', fontWeight: 700, fontSize: '0.97rem', cursor: 'pointer', width: '100%' }} onClick={() => { handleMonthYearSelect(month, year, setMonth, setYear, setShowMonthYearPicker); setShowMonthYearPicker(false); }}>Select</button>
                <button style={{ marginTop: 4, background: '#fff', color: '#7F8CAA', border: 'none', borderRadius: 8, padding: '0.3em 1.2em', fontWeight: 600, fontSize: '0.97rem', cursor: 'pointer', width: '100%' }} onClick={() => setShowMonthYearPicker(false)}>Cancel</button>
              </div>
            )}
          </div>
          <div className="calendar-controls" style={{ borderRadius: '8px', boxShadow: 'none', background: 'none', border: 'none', minHeight: 40, padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="view-select" style={{ color: '#1da1f2', fontWeight: 700, fontSize: '1rem', marginRight: 4 }}>View</label>
            <select id="view-select" value={calendarView} onChange={e => setCalendarView(e.target.value)} aria-label="Calendar view mode" style={{ borderRadius: 6, border: '1.2px solid #e3e6ea', background: '#fff', color: '#23242a', fontWeight: 700, fontSize: '1rem', padding: '4px 18px 4px 8px' }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div className="calendar-section" style={{ marginBottom: '0.5rem', background: 'none', boxShadow: 'none', borderRadius: 0, padding: 0 }}>
          {calendarView === 'monthly' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, width: '100%', maxWidth: 420, margin: '0 auto' }}>
                {(() => {
                  const monthDays = getMonthDays(year, month);
                  const firstDay = monthDays[0].getDay();
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) cells.push(null);
                  cells.push(...monthDays);
                  while (cells.length % 7 !== 0) cells.push(null);
                  return cells.map((cell, idx) => {
                    if (!cell) return <div key={idx} style={{ minHeight: '10vw', minWidth: '10vw' }} />;
                    const dateKey = cell.toISOString().split('T')[0];
                    const tasksForDate = taskTreeByDate[dateKey] || [];
                    const isToday = cell.toDateString() === new Date().toDateString();
                    const isSelected = cell.toDateString() === selectedDate.toDateString();
                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(cell, setSelectedDate, setToast)}
                        tabIndex={0}
                        style={{
                          cursor: 'pointer',
                          minHeight: '10vw',
                          minWidth: '10vw',
                          maxWidth: 44,
                          maxHeight: 44,
                          width: '100%',
                          height: '100%',
                          touchAction: 'manipulation',
                          position: 'relative',
                          textAlign: 'center',
                          fontSize: '0.92rem',
                          fontWeight: isToday ? 900 : 500,
                          color: isSelected ? (isToday ? '#fff' : '#fff') : (isToday ? '#1da1f2' : '#23242a'),
                          background: isSelected ? '#1da1f2' : 'none',
                          borderRadius: isSelected ? 8 : 0,
                          transition: 'background 0.13s, color 0.13s',
                          outline: isSelected ? '2px solid #1da1f2' : 'none',
                          zIndex: isSelected ? 2 : 1,
                          margin: 0,
                          padding: 0,
                          userSelect: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={`View events for ${cell.toLocaleDateString()}`}
                      >
                        {cell.getDate()}
                        {tasksForDate.length > 0 && <span style={{ display: 'block', margin: '0 auto', width: 6, height: 6, borderRadius: '50%', background: '#1da1f2', marginTop: 2 }} />}
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ height: 18 }} />
              <div className="calendar-events-list" style={{ marginTop: 0, background: 'none', boxShadow: 'none', borderRadius: 0, padding: 0 }}>
                <div className="calendar-event-date" style={{ color: '#23242a', fontWeight: 700, fontSize: '0.98rem', marginBottom: 8, background: 'none', border: 'none', boxShadow: 'none' }}>
                  {selectedDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {taskTreeByDate[selectedDate.toISOString().split('T')[0]]?.length === 0 && (
                  <div className="calendar-no-data animate-fadein" style={{ background: 'none', boxShadow: 'none', borderRadius: 0, color: '#7F8CAA', fontWeight: 600, fontSize: '1.05rem', padding: '1.1rem 0' }}>🎈 No events for this day. Enjoy your free time!</div>
                )}
                {(taskTreeByDate[selectedDate.toISOString().split('T')[0]] || []).map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', background: 'none', borderRadius: 0, boxShadow: 'none', borderLeft: 'none', marginBottom: 16, padding: '0.5em 0', gap: 8 }}>
                    <span style={{ fontSize: 17, marginRight: 5 }}>{typeIcon[task.type]}</span>
                    <span style={{ color: '#23242a', fontWeight: 600, fontSize: '0.97rem' }}>{task.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {calendarView === 'weekly' && (
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 0.5em', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, #1da1f2 60%, #e3e6ea 100%)', borderRadius: 2, zIndex: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2em', position: 'relative', zIndex: 1 }}>
                {getWeekDates(selectedDate).map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayTasks = taskTreeByDate[day.toISOString().split('T')[0]] || [];
                  if (dayTasks.length === 0) {
                    // No tasks: faded dot and date only
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', minHeight: 38, position: 'relative' }}>
                        <span style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#e3e6ea',
                          border: '2px solid #e3e6ea',
                          marginRight: 24,
                          marginLeft: 8,
                          marginTop: 2,
                          zIndex: 2,
                        }} />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ color: '#b0b8c9', fontWeight: 600, fontSize: '0.97rem' }}>{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    );
                  }
                  // Render each task as a step
                  return dayTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', minHeight: 38, position: 'relative' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: isToday ? '#1da1f2' : '#e3e6ea',
                        border: isToday ? '3px solid #1da1f2' : '2px solid #e3e6ea',
                        marginRight: 24,
                        marginLeft: 8,
                        marginTop: 2,
                        zIndex: 2,
                        boxShadow: isToday ? '0 0 0 2px #e3f2fd' : 'none',
                        transition: 'background 0.13s, border 0.13s',
                      }} />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontWeight: isToday ? 800 : 600, color: isToday ? '#1da1f2' : '#23242a', fontSize: isToday ? '1.05rem' : '0.99rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 18, marginRight: 4 }}>{typeIcon[task.type]}</span>
                          {task.title}
                        </span>
                        <span style={{ color: isToday ? '#1da1f2' : '#7F8CAA', fontWeight: 500, fontSize: '0.93rem', marginTop: 1 }}>
                          {day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, {new Date(task.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ));
                })}
              </div>
            </div>
          )}
          {calendarView === 'daily' && (
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}>
              <div style={{ color: '#23242a', fontWeight: 700, fontSize: '0.98rem', marginBottom: 8, background: 'none', border: 'none', boxShadow: 'none' }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              {taskTreeByDate[new Date().toISOString().split('T')[0]]?.length === 0 && (
                <div className="calendar-no-data animate-fadein" style={{ background: 'none', boxShadow: 'none', borderRadius: 0, color: '#7F8CAA', fontWeight: 600, fontSize: '1.05rem', padding: '1.1rem 0' }}>No events for today.</div>
              )}
              {(taskTreeByDate[new Date().toISOString().split('T')[0]] || []).map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', background: 'none', borderRadius: 0, boxShadow: 'none', borderLeft: 'none', marginBottom: 16, padding: '0.5em 0', gap: 8 }}>
                  <span style={{ fontSize: 17, marginRight: 5 }}>{typeIcon[task.type]}</span>
                  <span style={{ color: '#23242a', fontWeight: 600, fontSize: '0.97rem' }}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {toast && <div className="calendar-toast animate-toast">{toast}</div>}
      </div>
    </Layout>
  );
}