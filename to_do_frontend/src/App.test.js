import { render, screen } from '@testing-library/react';
import App, { filterTasks, createTask } from './App';

test('renders header title', () => {
  render(<App />);
  const title = screen.getByText(/Ocean Tasks/i);
  expect(title).toBeInTheDocument();
});

test('filterTasks filters correctly', () => {
  const tasks = [
    { id: '1', text: 'a', completed: false, createdAt: 1 },
    { id: '2', text: 'b', completed: true, createdAt: 2 },
  ];
  expect(filterTasks(tasks, 'all')).toHaveLength(2);
  expect(filterTasks(tasks, 'active')).toHaveLength(1);
  expect(filterTasks(tasks, 'completed')).toHaveLength(1);
});

test('createTask produces a valid task', () => {
  const t = createTask('hello');
  expect(t).toHaveProperty('id');
  expect(t.text).toBe('hello');
  expect(t.completed).toBe(false);
  expect(typeof t.createdAt).toBe('number');
});
