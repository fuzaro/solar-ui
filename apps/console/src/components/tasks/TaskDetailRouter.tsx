import { TaskDetail } from './TaskDetail';

export function TaskDetailRouter() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-solar-text-secondary)' }}>
        No task ID specified. <a href="/tasks/active">Back to tasks</a>
      </div>
    );
  }
  return <TaskDetail taskId={id} />;
}
