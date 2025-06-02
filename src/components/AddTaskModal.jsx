import React, { useState } from 'react';
import { createTaskWithSubtasksAndNotifications } from '../db/queries';

function emptyTask(level = 0) {
  return {
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium',
    category: 'Reminder',
    subtasks: [],
    level,
  };
}

function sanitizeTask(task) {
  const { title, description, due_date, priority, category, subtasks } = task;
  return {
    title,
    description,
    due_date,
    priority,
    category,
    is_completed: 0, // default to not completed
    subtasks: subtasks ? subtasks.map(sanitizeTask) : []
  };
}

function SubtaskInput({ task, onChange, onRemove, level = 0 }) {
  const handleField = (field, value) => {
    onChange({ ...task, [field]: value });
  };
  const handleSubtaskChange = (idx, sub) => {
    const updated = [...task.subtasks];
    updated[idx] = sub;
    onChange({ ...task, subtasks: updated });
  };
  const addSubtask = () => {
    onChange({ ...task, subtasks: [...task.subtasks, emptyTask(level + 1)] });
  };
  const removeSubtask = idx => {
    onChange({ ...task, subtasks: task.subtasks.filter((_, i) => i !== idx) });
  };
  return (
    <div style={{ borderLeft: `3px solid #1da1f2`, marginLeft: level ? 12 : 0, paddingLeft: 10, marginTop: 10, background: level ? '#f7fafd' : 'none', borderRadius: 8 }}>
      <input
        type="text"
        placeholder={level === 0 ? 'Task name' : `Subtask name`}
        value={task.title}
        onChange={e => handleField('title', e.target.value)}
        style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}
        required={level === 0}
      />
      <textarea
        placeholder="Description (optional)"
        value={task.description}
        onChange={e => handleField('description', e.target.value)}
        rows={2}
        style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}
      />
      <input
        type="datetime-local"
        value={task.due_date}
        onChange={e => handleField('due_date', e.target.value)}
        style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}
        placeholder="Set date and time"
        required={level === 0}
      />
      <select
        value={task.priority}
        onChange={e => handleField('priority', e.target.value)}
        style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}
      >
        <option value="High">High Priority</option>
        <option value="Medium">Medium Priority</option>
        <option value="Low">Low Priority</option>
      </select>
      <select
        value={task.category}
        onChange={e => handleField('category', e.target.value)}
        style={{ width: '100%', marginBottom: 6, padding: 8, borderRadius: 6, border: '1.2px solid #e3e6ea' }}
      >
        <option value="Reminder">Reminder</option>
        <option value="Personal">Personal</option>
        <option value="Grocery">Grocery</option>
        <option value="Meeting">Meeting</option>
        <option value="Work">Work</option>
        <option value="Family">Family</option>
        <option value="Other">Other</option>
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <button type="button" onClick={addSubtask} style={{ background: '#1da1f2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4em 1em', fontWeight: 700, cursor: 'pointer' }}>+ Subtask</button>
        {level > 0 && (
          <button type="button" onClick={onRemove} style={{ background: '#fa812f', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4em 1em', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
        )}
      </div>
      {task.subtasks.map((sub, idx) => (
        <SubtaskInput
          key={idx}
          task={sub}
          onChange={subtask => handleSubtaskChange(idx, subtask)}
          onRemove={() => removeSubtask(idx)}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export default function AddTaskModal({ open, onClose }) {
  const [task, setTask] = useState(emptyTask(0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (!task.title || !task.priority) {
        setError('Task title and priority are required.');
        setSubmitting(false);
        return;
      }
      const sanitizedTask = sanitizeTask(task);
      console.log('Submitting task:', sanitizedTask);
      await createTaskWithSubtasksAndNotifications(sanitizedTask);
      setTask(emptyTask(0));
      setSubmitting(false);
      onClose();
    } catch (err) {
      setError('Failed to add task: ' + (err.message || err));
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 'clamp(64px, 9vh, 100px)', background: 'rgba(30,32,38,0.18)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4vw', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #1da1f244', padding: '2.2em 1.2em 1.5em 1.2em', minWidth: 0, maxWidth: '98vw', width: 'min(98vw, 400px)', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ fontWeight: 800, fontSize: '1.18rem', color: '#23242a', marginBottom: 8 }}>Add Task</div>
        <SubtaskInput task={task} onChange={setTask} level={0} />
        {error && <div style={{ color: '#fa812f', fontWeight: 700 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ background: '#fff', color: '#1da1f2', border: '1.2px solid #1da1f2', borderRadius: 8, padding: '0.7em 1.2em', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', flex: 1 }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ background: '#1da1f2', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.2em', fontWeight: 700, fontSize: '1.05rem', cursor: submitting ? 'not-allowed' : 'pointer', flex: 1 }}>{submitting ? 'Adding...' : 'Add Task'}</button>
        </div>
      </form>
    </div>
  );
} 