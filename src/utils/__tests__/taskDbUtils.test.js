import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTaskWithEmbedding,
  getTaskById,
  getAllTasks,
  getTaskTreeByDate,
  createTaskWithSubtasksAndNotifications,
  createNotification,
  getNotifications,
  markNotificationRead,
  deleteNotification,
  getWeeklyParentTaskCount,
  getTodayParentTaskCount,
  generateSystemStatsNotifications
} from '../../db/queries';

const user_id = 1;

// Optionally clear DB before/after tests if needed
// beforeAll(async () => { /* clear test data */ });
// afterAll(async () => { /* clean up */ });

describe('Task DB Utils (Vitest)', () => {
  it('should create and fetch a task', async () => {
    const taskId = await createTaskWithEmbedding({
      user_id,
      title: 'Test Task',
      description: 'Test Desc',
      priority: 'Medium',
      due_date: new Date().toISOString()
    });
    const task = await getTaskById(taskId);
    expect(task).toBeTruthy();
    expect(task.title).toBe('Test Task');
  });

  it('should create nested subtasks and fetch as tree', async () => {
    const task = {
      user_id,
      title: 'Parent Task',
      description: '',
      priority: 'High',
      due_date: new Date().toISOString(),
      subtasks: [
        { title: 'Subtask 1', description: '', priority: 'Low', due_date: new Date().toISOString(), subtasks: [] }
      ]
    };
    const parentId = await createTaskWithSubtasksAndNotifications(task, null, user_id);
    const tree = await getTaskTreeByDate(user_id);
    const todayKey = new Date().toISOString().split('T')[0];
    expect(tree[todayKey].some(t => t.title === 'Parent Task')).toBe(true);
  });

  it('should create and fetch notifications', async () => {
    const notifId = await createNotification({ user_id, message: 'Test Notif', type: 'reminder' });
    const notifs = await getNotifications(user_id);
    expect(notifs.some(n => n.notification_id === notifId)).toBe(true);
    await markNotificationRead(notifId);
    const updated = await getNotifications(user_id);
    expect(updated.find(n => n.notification_id === notifId).read_status).toBe(1);
    await deleteNotification(notifId);
    const afterDelete = await getNotifications(user_id);
    expect(afterDelete.some(n => n.notification_id === notifId)).toBe(false);
  });

  it('should generate system stats notifications', async () => {
    await generateSystemStatsNotifications(user_id);
    const notifs = await getNotifications(user_id);
    expect(notifs.some(n => n.type === 'system')).toBe(true);
  });

  it('should return correct stats', async () => {
    const weekCount = await getWeeklyParentTaskCount(user_id);
    const todayCount = await getTodayParentTaskCount(user_id);
    expect(typeof weekCount).toBe('number');
    expect(typeof todayCount).toBe('number');
  });
}); 