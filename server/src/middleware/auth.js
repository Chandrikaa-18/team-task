import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    const result = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [payload.sub]);

    if (!result.rowCount) {
      throw new AppError(401, 'User no longer exists');
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError(401, 'Invalid or expired token'));
      return;
    }
    next(error);
  }
}

export function requireGlobalAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    next(new AppError(403, 'Admin role required'));
    return;
  }
  next();
}
