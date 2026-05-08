import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, signupSchema } from '../schemas.js';
import { AppError, validate } from '../utils/errors.js';

export const authRouter = Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

authRouter.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );
    const user = result.rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === '23505') {
      next(new AppError(409, 'Email is already registered'));
      return;
    }
    next(error);
  }
});

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [req.body.email]);
    if (!result.rowCount) {
      throw new AppError(401, 'Invalid email or password');
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(req.body.password, user.password_hash);
    if (!isValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
