import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
  Users
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const statuses = ['todo', 'in_progress', 'review', 'done'];
const priorities = ['low', 'medium', 'high'];

function label(value) {
  if (value === 'done') return 'Completed';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

async function api(path, options = {}, token) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => {
    let active = true;
    setState({ loading: true, error: '' });
    fn()
      .then((data) => active && setState({ loading: false, error: '', data }))
      .catch((error) => active && setState({ loading: false, error: error.message }));
    return () => {
      active = false;
    };
  }, deps);
  return state;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await api(path, { method: 'POST', body: JSON.stringify(payload) });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  function fillDemo(email, password) {
    setMode('login');
    setError('');
    setForm((current) => ({ ...current, email, password }));
  }

  return (
    <main className={`auth-shell auth-${mode}`}>
      {mode === 'login' && (
        <section className="auth-story" aria-label="TaskFlow overview">
          <div className="auth-wordmark">TaskFlow</div>
          <div className="auth-copy">
            <span>For modern teams</span>
            <h1>
              Plan projects.<br />
              Track work.<br />
              <strong>Ship together.</strong>
            </h1>
            <p>A clean, role-based task manager built for focused teams. Sign in to manage projects, assign work, and stay on top of every deadline.</p>
          </div>
          <div className="auth-footer">© 2026 TaskFlow Studio</div>
        </section>
      )}

      <section className={mode === 'login' ? 'auth-form-wrap' : 'auth-form-wrap signup-card'}>
        <div className="auth-form-head">
          <strong className="auth-mini-brand">TaskFlow</strong>
          <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
          <h2>{mode === 'login' ? 'Welcome back' : 'Join your team'}</h2>
          <p>
            {mode === 'login'
              ? 'Enter your credentials to access your workspace.'
              : 'Choose Admin to manage the team, or Member to work on assigned tasks.'}
          </p>
        </div>

        <form onSubmit={submit} className="form-grid auth-form">
          {mode === 'signup' && (
            <label>
              Full name
              <input
                required
                minLength="2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          {mode === 'signup' && (
            <label>
              Account role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              required
              minLength="8"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <div className="error"><AlertCircle size={16} />{error}</div>}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading && <Loader2 className="spin" size={18} />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}
          <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        {mode === 'login' && (
          <div className="demo-box">
            <span>Demo accounts</span>
            <button type="button" onClick={() => fillDemo('admin@example.com', 'Admin@12345')}>
              Admin - admin@example.com / Admin@12345
            </button>
            <button type="button" onClick={() => fillDemo('member@example.com', 'Member@12345')}>
              Member - member@example.com / Member@12345
            </button>
          </div>
        )}
      </section>

      <div className="floating-brain" aria-hidden="true">
        <Brain size={24} />
      </div>
    </main>
  );
}

function StatCard({ icon, labelText, value, tone }) {
  return (
    <article className={`stat ${tone || ''}`}>
      <span>{icon}</span>
      <div>
        <strong>{value ?? 0}</strong>
        <small>{labelText}</small>
      </div>
    </article>
  );
}

function ProjectForm({ token, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/projects', { method: 'POST', body: JSON.stringify(form) }, token);
      setForm({ name: '', description: '' });
      onCreated(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h2>New Project</h2>
      <label>
        Project name
        <input required minLength="3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <label>
        Description
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      {error && <div className="error"><AlertCircle size={16} />{error}</div>}
      <button className="primary" disabled={busy}><Plus size={18} />Create project</button>
    </form>
  );
}

function TaskForm({ token, project, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const assigneeOptions = project.availableUsers?.length ? project.availableUsers : project.members;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(
        `/projects/${project.project.id}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
            dueDate: form.dueDate || null
          })
        },
        token
      );
      setForm({ title: '', description: '', assigneeId: '', status: 'todo', priority: 'medium', dueDate: '' });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h2>Create Task</h2>
      <label>
        Title
        <input required minLength="3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label>
        Assignee
        <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
          <option value="">Unassigned</option>
          {assigneeOptions.map((member) => (
            <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
          ))}
        </select>
        <small className="field-hint">All registered Member accounts appear here. Assigning a task adds that member to this project.</small>
      </label>
      <div className="two-col">
        <label>
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
          </select>
        </label>
      </div>
      <label>
        Due date
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </label>
      <label>
        Notes
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      {error && <div className="error"><AlertCircle size={16} />{error}</div>}
      <button className="primary" disabled={busy}><Plus size={18} />Add task</button>
    </form>
  );
}

function ProjectDetail({ token, projectId, refreshKey, onRefresh, onProjectDeleted, user }) {
  const state = useAsync(() => api(`/projects/${projectId}`, {}, token), [token, projectId, refreshKey]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberError, setMemberError] = useState('');
  const [editProject, setEditProject] = useState(null);
  const [projectError, setProjectError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});

  if (state.loading) return <div className="panel loading"><Loader2 className="spin" /> Loading project</div>;
  if (state.error) return <div className="panel error"><AlertCircle size={16} />{state.error}</div>;

  const detail = state.data;
  const isProjectAdmin = user.role === 'admin' || detail.project.membership_role === 'admin';
  const visibleTasks = (user.role === 'admin' || isProjectAdmin ? detail.tasks : detail.tasks.filter((task) => task.assignee_id === user.id))
    .filter((task) => statusFilter === 'all' || task.status === statusFilter)
    .filter((task) => !overdueOnly || (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'));
  const done = detail.tasks.filter((task) => task.status === 'done').length;
  const progress = detail.tasks.length ? Math.round((done / detail.tasks.length) * 100) : 0;

  async function addMember(event) {
    event.preventDefault();
    setMemberError('');
    try {
      await api(
        `/projects/${projectId}/members`,
        { method: 'POST', body: JSON.stringify({ email: memberEmail, role: memberRole }) },
        token
      );
      setMemberEmail('');
      setMemberRole('member');
      onRefresh();
    } catch (err) {
      setMemberError(err.message);
    }
  }

  async function updateTask(task, patch) {
    await api(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(patch) }, token);
    onRefresh();
  }

  async function removeTask(task) {
    await api(`/tasks/${task.id}`, { method: 'DELETE' }, token);
    onRefresh();
  }

  async function saveProject(event) {
    event.preventDefault();
    setProjectError('');
    try {
      await api(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(editProject) }, token);
      setEditProject(null);
      onRefresh();
    } catch (err) {
      setProjectError(err.message);
    }
  }

  async function deleteProject() {
    await api(`/projects/${projectId}`, { method: 'DELETE' }, token);
    onProjectDeleted();
  }

  async function removeMember(userId) {
    await api(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }, token);
    onRefresh();
  }

  async function addComment(taskId) {
    const comment = commentDrafts[taskId]?.trim();
    if (!comment) return;
    await api(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ comment }) }, token);
    setCommentDrafts((current) => ({ ...current, [taskId]: '' }));
    onRefresh();
  }

  return (
    <section className="workspace-grid">
      <div className="main-column">
        <div className="section-heading">
          {editProject ? (
            <form className="project-edit-form" onSubmit={saveProject}>
              <input
                required
                minLength="3"
                value={editProject.name}
                onChange={(event) => setEditProject({ ...editProject, name: event.target.value })}
              />
              <textarea
                value={editProject.description}
                onChange={(event) => setEditProject({ ...editProject, description: event.target.value })}
              />
              {projectError && <div className="error"><AlertCircle size={16} />{projectError}</div>}
              <div className="action-row">
                <button className="primary small-action" type="submit"><Save size={16} />Save</button>
                <button className="ghost small-action" type="button" onClick={() => setEditProject(null)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div>
              <h2>{detail.project.name}</h2>
              <p>{detail.project.description || 'No description added yet.'}</p>
              {isProjectAdmin && (
                <div className="action-row">
                  <button
                    className="ghost small-action"
                    onClick={() => setEditProject({ name: detail.project.name, description: detail.project.description || '' })}
                  >
                    Edit project
                  </button>
                  <button className="danger small-action" onClick={deleteProject}><Trash2 size={16} />Delete</button>
                </div>
              )}
            </div>
          )}
          <div className="progress-ring">{progress}%</div>
        </div>
        <div className="board-toolbar">
          <label>
            Filter
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All tasks</option>
              {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={overdueOnly} onChange={(event) => setOverdueOnly(event.target.checked)} />
            Overdue only
          </label>
        </div>
        <div className="kanban">
          {(statusFilter === 'all' ? statuses : [statusFilter]).map((status) => (
            <div className="lane" key={status}>
              <h3>{label(status)}</h3>
              {visibleTasks.filter((task) => task.status === status).map((task) => (
                <article className={`task priority-${task.priority}`} key={task.id}>
                  <div className="task-top">
                    <strong>{task.title}</strong>
                    <span>{label(task.priority)}</span>
                  </div>
                  <p>{task.description || 'No notes'}</p>
                  <div className="task-meta">
                    <span>{task.assignee_name || 'Unassigned'}</span>
                    <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                  </div>
                  <div className="task-controls">
                    <select value={task.status} onChange={(e) => updateTask(task, { status: e.target.value })} aria-label="Task status">
                      {statuses.map((next) => <option key={next} value={next}>{label(next)}</option>)}
                    </select>
                    {isProjectAdmin && (
                      <select value={task.priority} onChange={(event) => updateTask(task, { priority: event.target.value })} aria-label="Task priority">
                        {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                      </select>
                    )}
                    {isProjectAdmin && (
                      <input
                        type="date"
                        value={task.due_date ? task.due_date.slice(0, 10) : ''}
                        onChange={(event) => updateTask(task, { dueDate: event.target.value || null })}
                        aria-label="Task deadline"
                      />
                    )}
                    {isProjectAdmin && (
                      <button className="danger icon-action" onClick={() => removeTask(task)} title="Delete task"><Trash2 size={16} /></button>
                    )}
                  </div>
                  <div className="task-comments">
                    {task.comments?.slice(0, 2).map((item) => (
                      <small key={item.id}>{item.author_name}: {item.comment}</small>
                    ))}
                    <div className="comment-row">
                      <input
                        value={commentDrafts[task.id] || ''}
                        onChange={(event) => setCommentDrafts({ ...commentDrafts, [task.id]: event.target.value })}
                        placeholder="Add update"
                      />
                      <button type="button" onClick={() => addComment(task.id)}>Add</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
      <aside className="side-column">
        {isProjectAdmin ? (
          <TaskForm token={token} project={detail} onSaved={onRefresh} />
        ) : (
          <div className="panel member-note">
            <h2>Member Mode</h2>
            <p>You can view assigned tasks and update their status. Project, team, priority, deadline, and delete actions are admin-only.</p>
          </div>
        )}
        <div className="panel">
          <h2>Team</h2>
          <div className="member-list">
            {detail.members.map((member) => (
              <div className="member" key={member.id}>
                <span>{member.name}</span>
                <div className="member-actions">
                  <small>{member.project_role}</small>
                  {isProjectAdmin && member.id !== detail.project.owner_id && (
                    <button className="text-danger" onClick={() => removeMember(member.id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isProjectAdmin && (
            <form className="inline-form" onSubmit={addMember}>
              <input
                type="email"
                placeholder="member@email.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
              />
              <select value={memberRole} onChange={(event) => setMemberRole(event.target.value)} aria-label="Project role">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button title="Add member"><Plus size={18} /></button>
              {memberError && <div className="error"><AlertCircle size={16} />{memberError}</div>}
            </form>
          )}
        </div>
      </aside>
    </section>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('ttm_session');
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const token = session?.token;
  const dashboard = useAsync(() => (token ? api('/dashboard', {}, token) : Promise.resolve(null)), [token, refreshKey]);
  const projects = useAsync(() => (token ? api('/projects', {}, token) : Promise.resolve({ projects: [] })), [token, refreshKey]);

  useEffect(() => {
    const projectList = projects.data?.projects || [];
    if (!projectList.length) {
      if (selectedProject) setSelectedProject(null);
      return;
    }

    const selectedStillExists = projectList.some((project) => project.id === selectedProject);
    if (!selectedProject || !selectedStillExists) {
      setSelectedProject(projectList[0].id);
    }
  }, [projects.data, selectedProject]);

  function onAuth(data) {
    localStorage.setItem('ttm_session', JSON.stringify(data));
    setSession(data);
  }

  function logout() {
    localStorage.removeItem('ttm_session');
    setSession(null);
    setSelectedProject(null);
  }

  function handleProjectDeleted() {
    setSelectedProject(null);
    setRefreshKey((value) => value + 1);
  }

  const summary = dashboard.data?.summary;
  const completion = useMemo(() => {
    const total = Number(summary?.total || 0);
    return total ? Math.round((Number(summary?.done || 0) / total) * 100) : 0;
  }, [summary]);

  if (!session) return <AuthScreen onAuth={onAuth} />;

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand-row compact">
          <div className="logo"><FolderKanban size={22} /></div>
          <div>
            <h1>Team Task Manager</h1>
            <p>{session.user.name} | {label(session.user.role)}</p>
          </div>
        </div>
        <button className="ghost" onClick={logout}><LogOut size={18} />Logout</button>
      </nav>

      <section className="dashboard">
        <StatCard icon={<BarChart3 />} labelText="All tasks" value={summary?.total} />
        <StatCard icon={<CheckCircle2 />} labelText="Completed" value={`${completion}%`} tone="green" />
        <StatCard icon={<Clock3 />} labelText="In progress" value={summary?.in_progress} tone="blue" />
        <StatCard icon={<AlertCircle />} labelText="Overdue" value={summary?.overdue} tone="red" />
      </section>

      <section className="layout">
        <aside className="project-rail">
          <div className="rail-title"><Users size={18} /> Projects</div>
          {projects.loading && <div className="loading"><Loader2 className="spin" /> Loading</div>}
          {projects.data?.projects?.map((project) => (
            <button
              key={project.id}
              className={selectedProject === project.id ? 'project-button active' : 'project-button'}
              onClick={() => setSelectedProject(project.id)}
            >
              <span>{project.name}</span>
              <small>{project.done_count}/{project.task_count} done</small>
            </button>
          ))}
          {session.user.role === 'admin' ? (
            <ProjectForm
              token={token}
              onCreated={(project) => {
                setSelectedProject(project.id);
                setRefreshKey((value) => value + 1);
              }}
            />
          ) : (
            <div className="panel member-note">
              <h2>Assigned Work</h2>
              <p>Members can view assigned projects and move their tasks through status updates.</p>
            </div>
          )}
        </aside>

        <div className="content">
          {dashboard.loading && <div className="panel loading"><Loader2 className="spin" /> Refreshing dashboard</div>}
          {dashboard.error && <div className="panel error"><AlertCircle size={16} />{dashboard.error}</div>}
          {selectedProject ? (
            <ProjectDetail
              token={token}
              projectId={selectedProject}
              refreshKey={refreshKey}
              onRefresh={() => setRefreshKey((value) => value + 1)}
              onProjectDeleted={handleProjectDeleted}
              user={session.user}
            />
          ) : (
            <div className="empty">
              <FolderKanban size={42} />
              <h2>Create your first project</h2>
              <p>Add a project from the left panel to start assigning work.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
