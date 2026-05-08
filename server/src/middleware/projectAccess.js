import { query } from '../db/pool.js';
import { forbidden, notFound } from '../utils/errors.js';

export async function loadProjectAccess(req, _res, next) {
  try {
    const projectId = Number(req.params.projectId || req.body.projectId);
    if (!Number.isInteger(projectId)) {
      next(notFound('Project not found'));
      return;
    }

    const result = await query(
      `SELECT p.*, pm.role AS membership_role
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1`,
      [projectId, req.user.id]
    );

    if (!result.rowCount) {
      next(notFound('Project not found'));
      return;
    }

    const project = result.rows[0];
    if (!project.membership_role && req.user.role !== 'admin') {
      next(forbidden('You are not a member of this project'));
      return;
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireProjectAdmin(req, _res, next) {
  if (req.user.role === 'admin' || req.project?.membership_role === 'admin') {
    next();
    return;
  }
  next(forbidden('Project admin access required'));
}
