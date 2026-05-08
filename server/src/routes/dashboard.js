import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const scope =
      req.user.role === 'admin'
        ? ''
        : 'JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1';
    const personalFilter = req.user.role === 'admin' ? '' : 'WHERE t.assignee_id = $1';
    const personalAndOpen = req.user.role === 'admin' ? 'WHERE t.status <> \'done\'' : 'WHERE t.status <> \'done\' AND t.assignee_id = $1';
    const params = req.user.role === 'admin' ? [] : [req.user.id];

    const [summary, upcoming, byProject] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'todo')::int AS todo,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'review')::int AS review,
           COUNT(*) FILTER (WHERE status = 'done')::int AS done,
           COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status <> 'done')::int AS overdue
         FROM tasks t ${scope} ${personalFilter}`,
        params
      ),
      query(
        `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name AS project_name, u.name AS assignee_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.assignee_id
         ${scope}
         ${personalAndOpen}
         ORDER BY t.due_date NULLS LAST, t.priority DESC, t.created_at DESC
         LIMIT 8`,
        params
      ),
      query(
        `SELECT p.id, p.name,
                COUNT(t.id)::int AS total,
                COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS done
         FROM projects p
         JOIN tasks t ON t.project_id = p.id
         ${req.user.role === 'admin' ? '' : 'JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1'}
         ${req.user.role === 'admin' ? '' : 'WHERE t.assignee_id = $1'}
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT 6`,
        params
      )
    ]);

    res.json({
      summary: summary.rows[0],
      upcoming: upcoming.rows,
      byProject: byProject.rows
    });
  } catch (error) {
    next(error);
  }
});
