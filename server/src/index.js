import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.isProduction ? undefined : true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'team-task-manager' });
});

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);

app.use(express.static(path.join(rootDir, 'dist')));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'));
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const payload = {
    message: status === 500 ? 'Something went wrong' : error.message,
    details: error.details || undefined
  };
  if (status === 500) {
    console.error(error);
  }
  res.status(status).json(payload);
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
