import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './pool.js';

const passwordAdmin = await bcrypt.hash('Admin@12345', 12);
const passwordMember = await bcrypt.hash('Member@12345', 12);

try {
  await withTransaction(async (client) => {
    const admin = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Aarav Sharma', 'admin@example.com', passwordAdmin]
    );
    const member = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Mira Kapoor', 'member@example.com', passwordMember]
    );

    await client.query('DELETE FROM projects WHERE name = $1 AND owner_id = $2', [
      'Gurugram Launch Plan',
      admin.rows[0].id
    ]);

    const project = await client.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Gurugram Launch Plan', 'Coordinate onboarding tasks, documents, and review milestones.', admin.rows[0].id]
    );

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'admin'), ($1, $3, 'member')
       ON CONFLICT DO NOTHING`,
      [project.rows[0].id, admin.rows[0].id, member.rows[0].id]
    );

    await client.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, status, priority, due_date, created_by)
       VALUES
       ($1, 'Prepare project brief', 'Finalize feature scope and acceptance checklist.', $2, 'done', 'high', CURRENT_DATE - INTERVAL '2 days', $2),
       ($1, 'Build task dashboard', 'Add status, overdue, and assignment summaries.', $3, 'in_progress', 'high', CURRENT_DATE + INTERVAL '2 days', $2),
       ($1, 'Review access control', 'Verify member and admin permissions.', $2, 'review', 'medium', CURRENT_DATE + INTERVAL '4 days', $2)
      `,
      [project.rows[0].id, admin.rows[0].id, member.rows[0].id]
    );
  });

  console.log('Demo data seeded.');
} catch (error) {
  console.error('Seed failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
