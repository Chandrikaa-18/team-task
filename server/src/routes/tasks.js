import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { commentSchema, taskUpdateSchema } from '../schemas.js';
import { AppError, forbidden, notFound, validate } from '../utils/errors.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

async function getTaskAccess(taskId, user) {
  const result = await query(
    `SELECT t.*, pm.role AS membership_role
     FROM tasks t
     JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $2
     WHERE t.id = $1`,
    [taskId, user.id]
  );

  if (!result.rowCount && user.role === 'admin') {
    const adminResult = await query('SELECT t.*, NULL AS membership_role FROM tasks t WHERE t.id = $1', [taskId]);
    return adminResult.rows[0] || null;
  }

  return result.rows[0] || null;
}

tasksRouter.patch('/:taskId', validate(taskUpdateSchema), async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    const task = await getTaskAccess(taskId, req.user);
    if (!task) {
      throw notFound('Task not found');
    }

    const isAdmin = req.user.role === 'admin' || task.membership_role === 'admin';
    const isAssignee = task.assignee_id === req.user.id;

    if (!isAdmin && !isAssignee) {
      throw forbidden('Only admins or the assignee can update this task');
    }
    if (!isAdmin) {
      const allowedMemberFields = ['status'];
      const invalid = Object.keys(req.body).some((field) => !allowedMemberFields.includes(field));
      if (invalid) {
        throw forbidden('Members can only update task status');
      }
    }

    if (req.body.assigneeId) {
      const member = await query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [
        task.project_id,
        req.body.assigneeId
      ]);
      if (!member.rowCount) {
        throw new AppError(400, 'Assignee must be a project member');
      }
    }

    const nextTask = {
      title: req.body.title ?? task.title,
      description: req.body.description ?? task.description,
      assigneeId: Object.hasOwn(req.body, 'assigneeId') ? req.body.assigneeId : task.assignee_id,
      status: req.body.status ?? task.status,
      priority: req.body.priority ?? task.priority,
      dueDate: Object.hasOwn(req.body, 'dueDate') ? req.body.dueDate : task.due_date
    };

    const result = await query(
      `UPDATE tasks
       SET title = $1, description = $2, assignee_id = $3, status = $4, priority = $5, due_date = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        nextTask.title,
        nextTask.description,
        nextTask.assigneeId,
        nextTask.status,
        nextTask.priority,
        nextTask.dueDate,
        taskId
      ]
    );

    res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete('/:taskId', async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    const task = await getTaskAccess(taskId, req.user);
    if (!task) {
      throw notFound('Task not found');
    }

    if (req.user.role !== 'admin' && task.membership_role !== 'admin') {
      throw forbidden('Only admins can delete tasks');
    }

    await query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

tasksRouter.post('/:taskId/comments', validate(commentSchema), async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    const task = await getTaskAccess(taskId, req.user);
    if (!task) {
      throw notFound('Task not found');
    }

    const isAdmin = req.user.role === 'admin' || task.membership_role === 'admin';
    const isAssignee = task.assignee_id === req.user.id;
    if (!isAdmin && !isAssignee) {
      throw forbidden('Only admins or the assignee can comment on this task');
    }

    const result = await query(
      `INSERT INTO task_comments (task_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, req.user.id, req.body.comment]
    );
    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
