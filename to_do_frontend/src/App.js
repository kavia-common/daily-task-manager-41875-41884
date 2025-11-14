import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Environment handling: honor variables if present for future backend usage.
 * Defaults to local storage persistence.
 */
const ENV = {
  API_BASE: process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '',
};

/**
 * Storage key for local persistence.
 */
const STORAGE_KEY = 'todo_tasks_v1';

/**
 * Task model:
 * { id: string, text: string, completed: boolean, createdAt: number }
 */

/**
 * Helpers: pure functions to simplify testing.
 */

// PUBLIC_INTERFACE
export function filterTasks(tasks, filter) {
  /** Filters tasks by status (all|active|completed). */
  if (filter === 'active') return tasks.filter(t => !t.completed);
  if (filter === 'completed') return tasks.filter(t => t.completed);
  return tasks;
}

// PUBLIC_INTERFACE
export function loadTasksFromStorage(storage = window.localStorage) {
  /** Loads tasks from localStorage. */
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(t => ({
      id: String(t.id),
      text: String(t.text || ''),
      completed: Boolean(t.completed),
      createdAt: Number(t.createdAt || Date.now()),
    }));
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export function saveTasksToStorage(tasks, storage = window.localStorage) {
  /** Saves tasks array into localStorage. */
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Fail silently – persistence is best-effort.
  }
}

// PUBLIC_INTERFACE
export function createTask(text) {
  /** Creates a Task object from text. */
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  };
}

/**
 * Accessible button component helper
 */
function IconButton({ label, onClick, children, className, ...rest }) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * TaskItem: supports toggle, inline edit (Enter save, Esc cancel), and delete.
 */
function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const next = draft.trim();
    if (next && next !== task.text) {
      onUpdate(task.id, { text: next });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(task.text);
      setIsEditing(false);
    }
  };

  return (
    <li className="todo-item" role="listitem">
      <div className="todo-item-left">
        <input
          id={`toggle-${task.id}`}
          type="checkbox"
          className="todo-checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-labelledby={`label-${task.id}`}
        />
        {!isEditing ? (
          <label
            id={`label-${task.id}`}
            htmlFor={`toggle-${task.id}`}
            className={`todo-text ${task.completed ? 'completed' : ''}`}
          >
            {task.text}
          </label>
        ) : (
          <input
            ref={inputRef}
            className="todo-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            aria-label="Edit task text"
          />
        )}
      </div>
      <div className="todo-item-actions" role="group" aria-label="Task actions">
        {!isEditing && (
          <IconButton
            label="Edit task"
            className="btn btn-ghost"
            onClick={() => setIsEditing(true)}
          >
            ✏️
          </IconButton>
        )}
        <IconButton
          label={task.completed ? 'Mark as active' : 'Mark as completed'}
          className="btn btn-ghost"
          onClick={() => onToggle(task.id)}
        >
          {task.completed ? '↩️' : '✅'}
        </IconButton>
        <IconButton
          label="Delete task"
          className="btn btn-ghost danger"
          onClick={() => onDelete(task.id)}
        >
          🗑️
        </IconButton>
      </div>
    </li>
  );
}

/**
 * Filters bar: All / Active / Completed
 */
function Filters({ filter, setFilter }) {
  const items = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
  ];
  return (
    <div className="filters" role="tablist" aria-label="Filter tasks">
      {items.map(i => (
        <button
          key={i.id}
          role="tab"
          aria-selected={filter === i.id}
          className={`chip ${filter === i.id ? 'chip-active' : ''}`}
          onClick={() => setFilter(i.id)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Main App: centered single-column layout with header, input form, list, and footer.
 */
// PUBLIC_INTERFACE
function App() {
  /** To-Do List application UI with localStorage persistence. */
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState('light');

  const inputRef = useRef(null);

  useEffect(() => {
    // Theme attribute for potential future dark mode extension
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load tasks on mount
  useEffect(() => {
    const loaded = loadTasksFromStorage();
    setTasks(loaded);
  }, []);

  // Save on change
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  const remaining = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const filteredTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    setTasks(prev => [createTask(text), ...prev]);
    setInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id, patch) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const apiInfo = ENV.API_BASE ? `Connected to ${ENV.API_BASE}` : 'Local storage mode';

  return (
    <div className="app-root">
      <header className="app-header" role="banner">
        <div className="header-content">
          <h1 className="app-title">Ocean Tasks</h1>
          <p className="app-subtitle" aria-live="polite">
            {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining • {apiInfo}
          </p>
        </div>
      </header>

      <main className="app-main" role="main">
        <section className="card input-card" aria-labelledby="add-task-heading">
          <h2 id="add-task-heading" className="sr-only">Add a new task</h2>
          <div className="input-row">
            <input
              ref={inputRef}
              className="input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="What do you need to get done?"
              aria-label="Task description"
            />
            <button
              className="btn btn-primary"
              onClick={addTask}
              aria-label="Add task"
            >
              Add
            </button>
          </div>
          <Filters filter={filter} setFilter={setFilter} />
        </section>

        <section className="card list-card" aria-labelledby="tasks-heading">
          <h2 id="tasks-heading" className="sr-only">Your tasks</h2>

          {filteredTasks.length === 0 ? (
            <div className="empty-state" role="status" aria-live="polite">
              <div className="empty-emoji" aria-hidden="true">🌊</div>
              <p className="empty-title">No tasks yet</p>
              <p className="empty-desc">Dive in and add your first task above.</p>
            </div>
          ) : (
            <ul className="todo-list" role="list" aria-label="Task list">
              {filteredTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                />
              ))}
            </ul>
          )}

          <div className="list-footer">
            <span className="muted">{tasks.length} total</span>
            <button
              className="btn btn-ghost danger"
              onClick={clearCompleted}
              disabled={!tasks.some(t => t.completed)}
            >
              Clear Completed
            </button>
          </div>
        </section>
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>Built with the Ocean Professional theme.</p>
      </footer>
    </div>
  );
}

export default App;
