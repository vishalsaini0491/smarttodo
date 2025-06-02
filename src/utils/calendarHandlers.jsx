// Calendar utility handlers for CalendarPage   

// Get week dates for the week containing the selected date
export function getWeekDates(selectedDate) {
  const today = new Date(selectedDate);
  const week = [];
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(new Date(d));
  }
  return week;
}

// Handle day click: update selected date and show toast
export function handleDayClick(cell, setSelectedDate, setToast) {
  setSelectedDate(new Date(cell));
  setToast(
    `Viewing events for ${new Date(cell).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })}`
  );
  setTimeout(() => setToast(""), 1200);
}

// Handle month/year selection
export function handleMonthYearSelect(m, y, setMonth, setYear, setShowMonthYearPicker) {
  setMonth(m);
  setYear(y);
  setShowMonthYearPicker(false);
}

// Render each task and its subtasks recursively
export function renderTaskTree(tasks, level = 0) {
  return tasks.map(task => (
    <div key={task.id} style={{ marginLeft: level * 16, borderLeft: level ? '2px solid #1da1f2' : 'none', paddingLeft: 6, marginTop: 2 }}>
      <span style={{ fontWeight: 700, color: level ? '#7fd7fa' : '#1da1f2' }}>{task.title}</span>
      {task.subtasks && task.subtasks.length > 0 && renderTaskTree(task.subtasks, level + 1)}
    </div>
  ));
} 