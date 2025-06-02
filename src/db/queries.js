import { getDB } from './initDB';
import { generateTaskEmbeddingBlob } from '../utils/embedding2';

// Format embedding context for OpenAI API
function formatEmbeddingContext({ task_id, parent_id, title, description, is_completed, priority, created_at, due_date }) {
  const duration = created_at && due_date ? Math.ceil((new Date(due_date) - new Date(created_at)) / (1000 * 60 * 60 * 24)) : "N/A";
  return `\nTask ID: ${task_id}\n   
  Parent Task ID: ${parent_id || "None"}\n    
  Task Title: ${title}\n    
  Description: ${description || "No description"}\n    
  Status: ${is_completed ? "completed" : "pending"}\n    
  Priority: ${priority}\n    
  Duration (in days): ${duration}\n  `.trim();
}

// Generate a unique task ID (not needed for AUTOINCREMENT, but kept for compatibility)
function generateTaskId() {
  return `TASK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Add task with optional subtasks (recursive, using parent_id)
export async function addTaskWithSubtasks({ title, description, due_date, priority, is_completed, category = 'Reminder', subtasks = [], parent_id = null, created_at = null, recurrence_rule_id = null }) {
  try {
    const db = await getDB();
    const now = created_at || new Date().toISOString();
    // Prepare embedding input using all available info
    const embeddingInput = formatEmbeddingContext({
      task_id: '', // will be set after insert
      parent_id,
      title,
      description,
      is_completed,
      priority,
      created_at: now,
      due_date,
      category,
      recurrence_rule_id
    });
    const embeddingBlob = await generateTaskEmbeddingBlob(embeddingInput);

    // Insert main task with embedding
    const result = await db.run(
      `INSERT INTO tasks (parent_id, title, description, due_date, priority, is_completed, category, vector_embedding, created_at, recurrence_rule_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [parent_id, title, description, due_date ? new Date(due_date).toISOString() : null, priority, is_completed === "Completed" ? 1 : 0, category, embeddingBlob, now, recurrence_rule_id]
    );

    const taskId = result.lastInsertRowId;
    // Recursively insert subtasks
    if (subtasks && subtasks.length) {
      for (const st of subtasks) {
        if (!st.title) continue;
        try {
          await addTaskWithSubtasks({
            ...st,
            parent_id: taskId,
            created_at: now // pass parent's created_at for duration
          });
        } catch (subErr) {
          console.error('Failed to add subtask:', subErr);
        }
      }
    }
    return taskId;
  } catch (err) {
    console.error('Failed to add task:', err);
    throw err;
  }
}

// Fetch all tasks and build a tree (tasks with subtasks)
export async function fetchAllTasks() {
  try {
    const db = await getDB();
    const tasksResult = await db.query(
      `SELECT * FROM tasks ORDER BY created_at DESC`
    );
    const tasks = tasksResult.values || [];
    // Build a map of id -> task
    const taskMap = {};
    tasks.forEach(task => {
      task.subtasks = [];
      task.status = task.is_completed ? "Completed" : "Pending";
      taskMap[task.id] = task;
    });
    // Build tree
    const rootTasks = [];
    tasks.forEach(task => {
      if (task.parent_id) {
        if (taskMap[task.parent_id]) {
          taskMap[task.parent_id].subtasks.push(task);
        }
      } else {
        rootTasks.push(task);
      }
    });
    return rootTasks;
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    throw err;
  }
}

// Delete a task and its subtasks (cascade delete is handled by DB)
export async function deleteTaskById(taskId) {
  try {
    const db = await getDB();
    await db.run(`DELETE FROM tasks WHERE id = ?`, [taskId]);
  } catch (err) {
    console.error('Failed to delete task:', err);
    throw err;
  }
}

// Export task ID generator if needed elsewhere
export { generateTaskId };

export async function updateTask(taskId, updates) {
  try {
    const db = await getDB();
    // 1. Update the fields in the DB (except vector_embedding)
    const fields = [];
    const values = [];
    for (const key in updates) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(taskId);
    if (fields.length > 1) { // Only update if there are fields to update
      await db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // 2. Fetch the updated row
    const res = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const updated = res.values && res.values[0];
    if (!updated) throw new Error('Task not found after update');

    // 3. Generate the new embedding from the updated data
    const embeddingInput = formatEmbeddingContext(updated);
    const embeddingBlob = await generateTaskEmbeddingBlob(embeddingInput);
    
    // 4. Update only the vector_embedding column
    await db.run(
      `UPDATE tasks SET vector_embedding = ? WHERE id = ?`,
      [embeddingBlob, taskId]
    );
    return true;
  } catch (err) {
    console.error('Failed to update task:', err);
    throw err;
  }
}

// Fetch all embeddings (optionally filter by type, etc.)
export async function fetchAllEmbeddings(type = 'task') {
  const db = await getDB();
  const { values } = await db.query(
    'SELECT id, embedding, type FROM task_embeddings WHERE type = ?',
    [type]
  );
  return values || [];
}

// Remove user_id from getTaskTreeByDate
export async function getTaskTreeByDate() {
  const db = await getDB();
  // Fetch all non-deleted tasks
  const res = await db.query('SELECT * FROM tasks WHERE deleted_at IS NULL OR deleted_at IS NULL', []);
  const tasks = res.values;

  // Group tasks by due_date
  const tasksByDate = {};
  for (const task of tasks) {
    const dateKey = task.due_date ? task.due_date.split('T')[0] : 'no_due_date';
    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
    tasksByDate[dateKey].push(task);
  }

  // Helper: build a tree for a flat list of tasks
  function buildTaskTree(taskList) {
    const taskMap = {};
    const roots = [];
    // Map all tasks by id
    for (const t of taskList) taskMap[t.id] = { ...t, subtasks: [] };
    // Build tree
    for (const t of taskList) {
      if (t.parent_id && taskMap[t.parent_id]) {
        taskMap[t.parent_id].subtasks.push(taskMap[t.id]);
      } else {
        roots.push(taskMap[t.id]);
      }
    }
    return roots;
  }

  // Build tree for each date
  const treeByDate = {};
  for (const date in tasksByDate) {
    treeByDate[date] = buildTaskTree(tasksByDate[date]);
  }
  return treeByDate;
}

// Remove user_id from getWeeklyParentTaskCount
export async function getWeeklyParentTaskCount() {
  const db = await getDB();
  // Get start and end of current week (Monday to Sunday)
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? 6 : day - 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const res = await db.query(
    `SELECT COUNT(*) as count FROM tasks WHERE parent_id IS NULL AND deleted_at IS NULL AND (
      (created_at BETWEEN ? AND ?) OR (is_completed = 1 AND updated_at BETWEEN ? AND ?)
    )`,
    [weekStart.toISOString(), weekEnd.toISOString(), weekStart.toISOString(), weekEnd.toISOString()]
  );
  return res.values[0]?.count || 0;
}

// Remove user_id from getTodayParentTaskCount
export async function getTodayParentTaskCount() {
  const db = await getDB();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const res = await db.query(
    `SELECT COUNT(*) as count FROM tasks WHERE parent_id IS NULL AND deleted_at IS NULL AND DATE(due_date) = ?`,
    [todayStr]
  );
  return res.values[0]?.count || 0;
}

// Remove user_id from getNotifications
export async function getNotifications() {
  const db = await getDB();
  const res = await db.query('SELECT * FROM notifications WHERE deleted_at IS NULL OR deleted_at IS NULL ORDER BY scheduled_for ASC', []);
  return res.values;
}

// --- Streak utilities ---
export async function getUserStreak() {
  const db = await getDB();
  const res = await db.query('SELECT streak FROM User WHERE id = 1');
  return res.values && res.values[0] ? res.values[0].streak : 0;
}

export async function setUserStreak(value) {
  const db = await getDB();
  await db.run('UPDATE User SET streak = ? WHERE id = 1', [value]);
}

export async function incrementUserStreak() {
  const db = await getDB();
  await db.run('UPDATE User SET streak = streak + 1 WHERE id = 1');
}

export async function resetUserStreak() {
  const db = await getDB();
  await db.run('UPDATE User SET streak = 0 WHERE id = 1');
}

// --- Streak update logic ---
export async function updateStreakForToday() {
  const db = await getDB();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  // Get all tasks due today
  const res = await db.query('SELECT is_completed FROM tasks WHERE DATE(due_date) = ?', [todayStr]);
  const tasks = res.values || [];
  if (tasks.length === 0) return; // No tasks today, do not change streak
  const allCompleted = tasks.every(t => t.is_completed);
  if (allCompleted) {
    await incrementUserStreak();
  } else {
    // If it's after midnight (or you want to check at app startup), reset streak
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 5) { // e.g. check in first 5 min after midnight
      await resetUserStreak();
    }
  }
}

// Export notification helpers for NotificationPage
export async function markNotificationRead(notification_id) {
  const db = await getDB();
  await db.run('UPDATE notifications SET read_status = 1 WHERE notification_id = ?', [notification_id]);
}

export async function deleteNotification(notification_id) {
  const db = await getDB();
  await db.run('DELETE FROM notifications WHERE notification_id = ?', [notification_id]);
}

export { fetchAllTasks as getAllTasks };

// Create a single task with embedding (for embeddingTaskWiring.js compatibility)
export async function createTaskWithEmbedding({ parent_id = null, title, description = '', priority, due_date, category = 'Reminder', is_completed = 0, created_at = null, recurrence_rule_id = null }) {
  const db = await getDB();
  const now = created_at || new Date().toISOString();
  // Prepare embedding input
  const embeddingInput = formatEmbeddingContext({
    task_id: '', // will be set after insert
    parent_id,
    title,
    description,
    is_completed,
    priority,
    created_at: now,
    due_date,
    category,
    recurrence_rule_id
  });
  const embeddingBlob = await generateTaskEmbeddingBlob(embeddingInput);
  // Insert the task
  const result = await db.run(
    `INSERT INTO tasks (parent_id, title, description, is_completed, due_date, priority, category, vector_embedding, created_at, recurrence_rule_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parent_id, title, description, is_completed, due_date ? new Date(due_date).toISOString() : null, priority, category, embeddingBlob, now, recurrence_rule_id]
  );
  return result.lastInsertRowId;
}

export { addTaskWithSubtasks as createTaskWithSubtasksAndNotifications };
