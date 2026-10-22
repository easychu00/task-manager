// ---------- DOM 元素 ----------
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

// ---------- 加载任务 ----------
async function loadTasks() {
  try {
    const url = currentFilter === 'all'
      ? '/api/tasks'
      : `/api/tasks?priority=${encodeURIComponent(currentFilter)}`;
    const res = await fetch(url);
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error('加载任务失败:', err);
    taskList.innerHTML = '<div class="empty-state"><p>⚠️ 加载失败，请检查后端服务</p></div>';
  }
}

// ---------- 渲染任务列表 ----------
function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>暂无任务，添加一个吧 ✨</p></div>';
    return;
  }

  taskList.innerHTML = tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-main">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="priority-badge priority-${task.priority}">${task.priority}优先级</span>
          <span class="status-badge ${task.completed ? 'done' : ''}">
            ${task.completed ? '✅ 已完成' : '⏳ 进行中'}
          </span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-toggle ${task.completed ? 'done' : ''}" data-action="toggle">
          ${task.completed ? '标记未完成' : '标记完成'}
        </button>
        <button class="btn-delete" data-action="delete">删除</button>
      </div>
    </div>
  `).join('');
}

// ---------- 添加任务 ----------
async function addTask() {
  const title = taskInput.value.trim();
  const priority = prioritySelect.value;
  if (!title) {
    taskInput.focus();
    return;
  }
  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, priority })
    });
    taskInput.value = '';
    taskInput.focus();
    loadTasks();
  } catch (err) {
    console.error('添加失败:', err);
    alert('添加任务失败，请重试');
  }
}

// ---------- 事件绑定 ----------
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// 列表事件委托：切换状态 / 删除
taskList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const item = e.target.closest('.task-item');
  const id = item.dataset.id;
  const action = btn.dataset.action;

  if (action === 'toggle') {
    await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
    loadTasks();
  } else if (action === 'delete') {
    if (confirm('确定删除这条任务吗？')) {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      loadTasks();
    }
  }
});

// 筛选按钮
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.priority;
    loadTasks();
  });
});

// ---------- 工具函数 ----------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 初始化 ----------
loadTasks();
