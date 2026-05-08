import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadProjectAccess, requireProjectAdmin } from '../middleware/projectAccess.js';
import { memberSchema, projectSchema, taskSchema } from '../schemas.js';
import { AppError, forbidden, notFound, validate } from '../utils/errors.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', async (req, res, next) => {
  try {
    const countClause =
      req.user.role === 'admin'
        ? ''
        : 'AND (t.assignee_id = $1 OR t.id IS NULL)';
    const result = await query(
      `SELECT p.id, p.name, p.description, p.owner_id, p.created_at,
              COALESCE(current_pm.role, 'admin') AS membership_role,
              COUNT(DISTINCT t.id) AS task_count,
              COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') AS done_count
       FROM projects p
       LEFT JOIN project_members current_pm ON current_pm.project_id = p.id AND current_pm.user_id = $1
       LEFT JOIN tasks t ON t.project_id = p.id ${countClause}
       WHERE $2 = 'admin'
          OR EXISTS (
            SELECT 1 FROM tasks assigned_task
            WHERE assigned_task.project_id = p.id AND assigned_task.assignee_id = $1
          )
       GROUP BY p.id, current_pm.role
       ORDER BY p.created_at DESC`,
      [req.user.id, req.user.role]
    );
    res.json({ projects: result.rows });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post('/', validate(projectSchema), async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can create projects');
    }
    const project = await withTransaction(async (client) => {
      const created = await client.query(
        `INSERT INTO projects (name, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.body.name, req.body.description, req.user.id]
      );
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'admin')`,
        [created.rows[0].id, req.user.id]
      );
      return created.rows[0];
    });
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.patch('/:projectId', loadProjectAccess, requireProjectAdmin, validate(projectSchema), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE projects
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [req.body.name, req.body.description, req.project.id]
    );
    res.json({ project: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

projectsRouter.delete('/:projectId', loadProjectAccess, requireProjectAdmin, async (req, res, next) => {
  try {
    await query('DELETE FROM projects WHERE id = $1', [req.project.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

projectsRouter.get('/:projectId', loadProjectAccess, async (req, res, next) => {
  try {
    const taskWhere =
      req.user.role === 'admin' || req.project.membership_role === 'admin'
        ? 't.project_id = $1'
        : 't.project_id = $1 AND t.assignee_id = $2';
    const taskParams =
      req.user.role === 'admin' || req.project.membership_role === 'admin'
        ? [req.project.id]
        : [req.project.id, req.user.id];
    const [members, tasks, availableUsers] = await Promise.all([
      query(
        `SELECT u.id, u.name, u.email, u.role AS global_role, pm.role AS project_role
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = $1
         ORDER BY pm.role, u.name`,
        [req.project.id]
      ),
      query(
        `SELECT t.*, u.name AS assignee_name, u.email AS assignee_email, c.name AS creator_name,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', tc.id,
                      'comment', tc.comment,
                      'created_at', tc.created_at,
                      'author_name', cu.name
                    )
                    ORDER BY tc.created_at DESC
                  ) FILTER (WHERE tc.id IS NOT NULL),
                  '[]'
                ) AS comments
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_id
         LEFT JOIN users c ON c.id = t.created_by
         LEFT JOIN task_comments tc ON tc.task_id = t.id
         LEFT JOIN users cu ON cu.id = tc.user_id
         WHERE ${taskWhere}
         GROUP BY t.id, u.name, u.email, c.name
         ORDER BY COALESCE(t.due_date, CURRENT_DATE + INTERVAL '1 year'), t.created_at DESC`,
        taskParams
      ),
      query(
        `SELECT id, name, email, role
         FROM users
         WHERE role = 'member'
         ORDER BY name, email`
      )
    ]);

    res.json({ project: req.project, members: members.rows, tasks: tasks.rows, availableUsers: availableUsers.rows });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post(
  '/:projectId/members',
  loadProjectAccess,
  requireProjectAdmin,
  validate(memberSchema),
  async (req, res, next) => {
    try {
      const user = await query('SELECT id, name, email, role FROM users WHERE email = $1', [req.body.email]);
      if (!user.rowCount) {
        throw notFound('No registered user found for that email');
      }

      await query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [req.project.id, user.rows[0].id, req.body.role]
      );

      res.status(201).json({ member: { ...user.rows[0], projectRole: req.body.role } });
    } catch (error) {
      next(error);
    }
  }
);

projectsRouter.delete('/:projectId/members/:userId', loadProjectAccess, requireProjectAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (userId === req.project.owner_id) {
      throw new AppError(400, 'Project owner cannot be removed');
    }
    await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.project.id, userId]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

projectsRouter.post('/:projectId/tasks', loadProjectAccess, validate(taskSchema), async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.project.membership_role !== 'admin') {
      throw forbidden('Only admins can create and assign tasks');
    }

    if (req.body.assigneeId) {
      const assignee = await query('SELECT id, role FROM users WHERE id = $1', [req.body.assigneeId]);
      if (!assignee.rowCount) {
        throw new AppError(400, 'Assignee must be a registered user');
      }
      if (assignee.rows[0].role !== 'member') {
        throw new AppError(400, 'Tasks must be assigned to a member account');
      }
      await query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [req.project.id, req.body.assigneeId]
      );
    }

    const result = await query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, status, priority, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.project.id,
        req.body.title,
        req.body.description,
        req.body.assigneeId,
        req.body.status,
        req.body.priority,
        req.body.dueDate,
        req.user.id
      ]
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
