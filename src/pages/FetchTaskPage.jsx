import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import "../styles/FetchTaskStyle.css";
import { fetchAllTasks, deleteTaskById, updateTask } from "../db/queries";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const categoryIcons = {
  Work: "💼",
  Personal: "🏠",
  Meeting: "👥",
  Study: "📚",
  Health: "💪",
  Grocery: "🛒",
  Family: "👪",
  Other: "☑",
  Reminder: "⏰", 
};

function badgeClass(type, value) {
  return `fetch-task-badge fetch-task-badge-${type}-${value.replace(/\s+/g, '-').toLowerCase()}`;
}

function smartTaskSort(tasks) {
  const priorityValue = (priority) => {
    if (!priority) return 3;
    return { "High": 1, "Medium": 2, "Low": 3 }[priority] || 4;
  };
  const timeUntilDue = (task) => {
    if (!task.due_date) return Infinity;
    return new Date(task.due_date) - new Date();
  };
  const taskSize = (task) => (task.subtasks ? task.subtasks.length : 0);

  return [...tasks].sort((a, b) => {
    const pA = priorityValue(a.priority);
    const pB = priorityValue(b.priority);
    if (pA !== pB) return pA - pB;
    const uA = timeUntilDue(a);
    const uB = timeUntilDue(b);
    if (uA !== uB) return uA - uB;
    const sA = taskSize(a);
    const sB = taskSize(b);
    return sB - sA;
  });
}

function EditTaskModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setForm(initial || {}); setError(""); }, [initial, open]);
  if (!open) return null;
  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const updates = {};
      ["title", "description", "due_date", "priority", "category"].forEach(k => {
        if (form[k] !== initial[k]) updates[k] = form[k];
      });
      if (Object.keys(updates).length === 0) throw new Error("No changes to save");
      await onSave(updates);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update task");
    } finally { setLoading(false); }
  };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30,32,38,0.18)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4vw', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #1da1f244', padding: '2.2em 1.2em 1.5em 1.2em', minWidth: 0, maxWidth: '98vw', width: 'min(98vw, 400px)', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ fontWeight: 800, fontSize: '1.18rem', color: '#23242a', marginBottom: 8 }}>Edit Task</div>
        <input type="text" value={form.title || ""} onChange={e => handleChange("title", e.target.value)} placeholder="Task name" style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }} required />
        <textarea value={form.description || ""} onChange={e => handleChange("description", e.target.value)} placeholder="Description (optional)" rows={2} style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }} />
        <input type="datetime-local" value={form.due_date ? form.due_date.slice(0, 16) : ""} onChange={e => handleChange("due_date", e.target.value)} style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }} placeholder="Set date and time" />
        <select value={form.priority || "Medium"} onChange={e => handleChange("priority", e.target.value)} style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        <select value={form.category || "Reminder"} onChange={e => handleChange("category", e.target.value)} style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}>
          <option value="Reminder">Reminder</option>
          <option value="Personal">Personal</option>
          <option value="Grocery">Grocery</option>
          <option value="Meeting">Meeting</option>
          <option value="Work">Work</option>
          <option value="Family">Family</option>
          <option value="Other">Other</option>
        </select>
        {error && <div style={{ color: '#fa812f', fontWeight: 700 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ background: '#fff', color: '#1da1f2', border: '1.2px solid #1da1f2', borderRadius: 8, padding: '0.7em 1.2em', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', flex: 1 }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ background: '#1da1f2', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.2em', fontWeight: 700, fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer', flex: 1 }}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

function SortableTaskCard({ task, expanded, setExpanded, listeners, attributes, setNodeRef, style, refreshTasks }) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubtask, setEditSubtask] = useState(null);
  const handleDelete = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await deleteTaskById(task.id);
      await refreshTasks();
    } finally {
      setLoading(false);
    }
  };
  const handleComplete = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await updateTask(task.id, { is_completed: 1 });
      await refreshTasks();
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`fetch-task-card${expanded === task.id ? " expanded" : ""}`}
        onClick={() => setExpanded(expanded === task.id ? null : task.id)}
      >
        <div className="fetch-task-row">
          <span className="fetch-task-icon" title={task.category || 'Task'}>
            {categoryIcons[task.category] || categoryIcons['Task']}
          </span>
          <div className="fetch-task-main">
            <span className="fetch-task-name">{task.title || task.name}</span>
            <div className="fetch-task-badges">
              <span className={badgeClass("priority", task.priority)}>{task.priority}</span>
              <span className={badgeClass("status", task.status || (task.is_completed ? "Completed" : "Not Completed"))}>{task.status || (task.is_completed ? "Completed" : "Not Completed")}</span>
              {task.due_date && (
                <span className={badgeClass("due", "date")}>{new Date(task.due_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {/* Mark as completed button */}
          {!task.is_completed && (
            <button
              type="button"
              className="fetch-task-action-btn"
              title="Mark as completed"
              aria-label="Mark as completed"
              onClick={handleComplete}
              disabled={loading}
              style={{ marginLeft: 8, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3em 0.7em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16 }}
            >
              ✔️
            </button>
          )}
          {/* Delete button */}
          <button
            type="button"
            className="fetch-task-action-btn"
            title="Delete task"
            aria-label="Delete task"
            onClick={handleDelete}
            disabled={loading}
            style={{ marginLeft: 8, background: '#fa3e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3em 0.7em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16 }}
          >
            🗑️
          </button>
          {/* Edit button for main task */}
          <button
            type="button"
            className="fetch-task-action-btn"
            title="Edit task"
            aria-label="Edit task"
            onClick={e => { e.stopPropagation(); setEditOpen(true); }}
            style={{ marginLeft: 8, background: '#ffd700', color: '#23242a', border: 'none', borderRadius: 6, padding: '0.3em 0.7em', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}
          >✏️</button>
          <button
            type="button"
            className="fetch-task-expand-btn"
            aria-label={expanded === task.id ? "Collapse" : "Expand"}
            title={expanded === task.id ? "Collapse" : "Expand"}
            onClick={e => { e.stopPropagation(); setExpanded(expanded === task.id ? null : task.id); }}
          >
            {expanded === task.id ? "▲" : "▼"}
          </button>
        </div>
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="fetch-task-subtask-summary">
            {task.subtasks.slice(0, 2).map((st) => (
              <div key={st.id} className="fetch-task-subtask-summary-item">
                <span className="fetch-task-subtask-name">{st.title || st.name}</span>
                <span className={badgeClass("priority", st.priority)}>{st.priority}</span>
                <span className={badgeClass("status", st.status || (st.is_completed ? "Completed" : "Not Completed"))}>{st.status || (st.is_completed ? "Completed" : "Not Completed")}</span>
                {st.due_date && (
                  <span className={badgeClass("due", "date")}>{new Date(st.due_date).toLocaleDateString()}</span>
                )}
                {/* Subtask actions */}
                {!st.is_completed && (
                  <button
                    type="button"
                    className="fetch-task-action-btn"
                    title="Mark subtask as completed"
                    aria-label="Mark subtask as completed"
                    onClick={async (e) => { e.stopPropagation(); setLoading(true); try { await updateTask(st.id, { is_completed: 1 }); await refreshTasks(); } finally { setLoading(false); } }}
                    disabled={loading}
                    style={{ marginLeft: 6, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '0.2em 0.6em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}
                  >✔️</button>
                )}
                <button
                  type="button"
                  className="fetch-task-action-btn"
                  title="Delete subtask"
                  aria-label="Delete subtask"
                  onClick={async (e) => { e.stopPropagation(); setLoading(true); try { await deleteTaskById(st.id); await refreshTasks(); } finally { setLoading(false); } }}
                  disabled={loading}
                  style={{ marginLeft: 6, background: '#fa3e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.2em 0.6em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}
                >🗑️</button>
                {/* Edit subtask button */}
                <button
                  type="button"
                  className="fetch-task-action-btn"
                  title="Edit subtask"
                  aria-label="Edit subtask"
                  onClick={e => { e.stopPropagation(); setEditSubtask(st); }}
                  style={{ marginLeft: 6, background: '#ffd700', color: '#23242a', border: 'none', borderRadius: 6, padding: '0.2em 0.6em', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                >✏️</button>
              </div>
            ))}
            {task.subtasks.length > 2 && (
              <span className="fetch-task-subtask-more">
                +{task.subtasks.length - 2} more
              </span>
            )}
          </div>
        )}
        {expanded === task.id && task.subtasks && task.subtasks.length > 0 && (
          <div className="fetch-task-subtasks">
            <div className="fetch-task-subtasks-title">Subtasks</div>
            {task.subtasks.map((st) => (
              <div key={st.id} className="fetch-task-subtask-detail">
                <div className="fetch-task-subtask-detail-row">
                  <span className="fetch-task-subtask-detail-name">{st.title || st.name}</span>
                  <span className={badgeClass("priority", st.priority)}>{st.priority}</span>
                  <span className={badgeClass("status", st.status || (st.is_completed ? "Completed" : "Not Completed"))}>{st.status || (st.is_completed ? "Completed" : "Not Completed")}</span>
                  {st.due_date && (
                    <span className={badgeClass("due", "date")}>{new Date(st.due_date).toLocaleDateString()}</span>
                  )}
                  {/* Subtask actions in expanded view */}
                  {!st.is_completed && (
                    <button
                      type="button"
                      className="fetch-task-action-btn"
                      title="Mark subtask as completed"
                      aria-label="Mark subtask as completed"
                      onClick={async (e) => { e.stopPropagation(); setLoading(true); try { await updateTask(st.id, { is_completed: 1 }); await refreshTasks(); } finally { setLoading(false); } }}
                      disabled={loading}
                      style={{ marginLeft: 6, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '0.2em 0.6em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}
                    >✔️</button>
                  )}
                  <button
                    type="button"
                    className="fetch-task-action-btn"
                    title="Delete subtask"
                    aria-label="Delete subtask"
                    onClick={async (e) => { e.stopPropagation(); setLoading(true); try { await deleteTaskById(st.id); await refreshTasks(); } finally { setLoading(false); } }}
                    disabled={loading}
                    style={{ marginLeft: 6, background: '#fa3e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.2em 0.6em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}
                  >🗑️</button>
                  {/* Edit subtask button in expanded view */}
                  <button
                    type="button"
                    className="fetch-task-action-btn"
                    title="Edit subtask"
                    aria-label="Edit subtask"
                    onClick={e => { e.stopPropagation(); setEditSubtask(st); }}
                    style={{ marginLeft: 6, background: '#ffd700', color: '#23242a', border: 'none', borderRadius: 6, padding: '0.2em 0.6em', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                  >✏️</button>
                </div>
                <span className="fetch-task-subtask-desc">{st.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <EditTaskModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={task}
        onSave={async (updates) => { await updateTask(task.id, updates); await refreshTasks(); }}
      />
      <EditTaskModal
        open={!!editSubtask}
        onClose={() => setEditSubtask(null)}
        initial={editSubtask}
        onSave={async (updates) => { if (editSubtask) { await updateTask(editSubtask.id, updates); await refreshTasks(); setEditSubtask(null); } }}
      />
    </>
  );
}

export default function FetchTaskPage() {
  const [expanded, setExpanded] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskOrder, setTaskOrder] = useState([]);

  const refreshTasks = async () => {
    const fetched = await fetchAllTasks();
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTasks = fetched.filter(t => (t.due_date || t.date || "").startsWith(todayStr));
    setTasks(todayTasks);
    setTaskOrder(todayTasks.map(t => t.id));
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  // Sort tasks by smart order, then by user drag order
  const sortedTasks = smartTaskSort(tasks).sort(
    (a, b) => taskOrder.indexOf(a.id) - taskOrder.indexOf(b.id)
  );

  // dnd-kit setup
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTaskOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <Layout>
      <div className="fetch-task-container fetchtask-modern-card animate-fadein">
        <h2 className="fetch-task-title">Today's Tasks</h2>
        <div className="fetch-task-subtitle">
          Drag to reorder, or click a task card to expand and view subtasks.
        </div>
        {tasks.length === 0 && (
          <div className="fetch-task-empty fetchtask-modern-empty">
            🎉 You have no tasks for today!
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {sortedTasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                expanded={expanded}
                setExpanded={setExpanded}
                refreshTasks={refreshTasks}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </Layout>
  );
}

function SortableTask({ task, expanded, setExpanded, refreshTasks }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab"
  };
  return (
    <SortableTaskCard
      task={task}
      expanded={expanded}
      setExpanded={setExpanded}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
      refreshTasks={refreshTasks}
    />
  );
}














