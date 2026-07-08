import {
  isGuestbookConfigured,
  listNotes,
  createNote,
  updatePosition,
  pickColor,
  randomPosition,
} from '../public/guestbook.js';

const container = document.getElementById('sticky-container');
const emptyMessage = document.getElementById('emptyMessage');
const composeForm = document.getElementById('composeForm');
const composeNote = document.querySelector('.sticky-compose-note');

let notes = [];
let maxZ = 100;
let draggedNote = null;
let dragEl = null;
let offsetX = 0;
let offsetY = 0;

function formatTime(ts) {
  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

function updateEmptyState() {
  emptyMessage.style.display = notes.length ? 'none' : 'flex';
}

function showConfigError() {
  composeForm.querySelector('button').disabled = true;
  composeForm.querySelectorAll('input, textarea').forEach((field) => {
    field.disabled = true;
  });
  composeNote.textContent =
    '留言板尚未配置：请在项目根目录创建 .env 并设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY，然后重新构建站点。';
  composeNote.style.color = 'rgba(255, 120, 120, 0.85)';
  emptyMessage.textContent = '留言板未配置，暂时无法加载便签';
  emptyMessage.style.display = 'flex';
}

function showError(message) {
  composeNote.textContent = message;
  composeNote.style.color = 'rgba(255, 120, 120, 0.85)';
}

function createNoteElement(note) {
  const el = document.createElement('article');
  el.className = `sticky-note ${note.color}`;
  el.dataset.id = note.id;
  el.style.left = `${note.left}px`;
  el.style.top = `${note.top}px`;
  el.style.zIndex = String(note.zIndex || 1);
  el.style.transform = `rotate(${note.rotate || 0}deg)`;

  const header = document.createElement('div');
  header.className = 'sticky-header';

  const author = document.createElement('span');
  author.className = 'sticky-author';
  author.textContent = note.name;

  const time = document.createElement('span');
  time.className = 'sticky-time';
  time.textContent = formatTime(note.createdAt);

  header.appendChild(author);
  header.appendChild(time);

  const content = document.createElement('div');
  content.className = 'sticky-content';
  content.textContent = note.content;

  el.appendChild(header);
  el.appendChild(content);

  return el;
}

function renderNotes() {
  container.querySelectorAll('.sticky-note').forEach((node) => node.remove());
  notes.forEach((note) => container.appendChild(createNoteElement(note)));
  maxZ = Math.max(100, ...notes.map((note) => note.zIndex || 1));
  updateEmptyState();
}

async function persistPosition(note) {
  try {
    await updatePosition(note.id, note.left, note.top, note.zIndex);
  } catch {
    showError('保存位置失败，请刷新页面后重试');
  }
}

composeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isGuestbookConfigured()) return;

  const nameInput = document.getElementById('noteName');
  const contentInput = document.getElementById('noteContent');
  const name = nameInput.value.trim() || '匿名访客';
  const content = contentInput.value.trim();
  if (!content) return;

  const position = randomPosition(container.clientWidth || 900, container.clientHeight || 600);
  const submitButton = composeForm.querySelector('button');
  submitButton.disabled = true;

  try {
    const note = await createNote({
      name,
      content,
      color: pickColor(notes.length),
      rotate: Number(((Math.random() - 0.5) * 4).toFixed(1)),
      left: position.left,
      top: position.top,
      zIndex: ++maxZ,
    });

    notes.unshift(note);
    container.prepend(createNoteElement(note));
    updateEmptyState();
    composeForm.reset();
  } catch {
    showError('发布留言失败，请稍后再试');
  } finally {
    submitButton.disabled = false;
  }
});

container.addEventListener('mousedown', (event) => {
  dragEl = event.target.closest('.sticky-note');
  if (!dragEl) return;

  event.preventDefault();
  draggedNote = dragEl;
  maxZ += 1;
  draggedNote.style.zIndex = String(maxZ);
  draggedNote.classList.add('dragging');

  const rect = draggedNote.getBoundingClientRect();
  offsetX = event.clientX - rect.left;
  offsetY = event.clientY - rect.top;
});

document.addEventListener('mousemove', (event) => {
  if (!draggedNote) return;

  const containerRect = container.getBoundingClientRect();
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;
  const newLeft = event.clientX - containerRect.left - offsetX + scrollLeft;
  const newTop = event.clientY - containerRect.top - offsetY + scrollTop;
  const maxLeft = container.scrollWidth - draggedNote.offsetWidth;
  const maxTop = container.scrollHeight - draggedNote.offsetHeight;

  draggedNote.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
  draggedNote.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
});

function finishDrag() {
  if (!draggedNote) return;

  const id = draggedNote.dataset.id;
  const note = notes.find((item) => item.id === id);
  if (note) {
    note.left = parseInt(draggedNote.style.left, 10) || note.left;
    note.top = parseInt(draggedNote.style.top, 10) || note.top;
    note.zIndex = parseInt(draggedNote.style.zIndex, 10) || note.zIndex;
    persistPosition(note);
  }

  draggedNote.classList.remove('dragging');
  draggedNote = null;
  dragEl = null;
}

document.addEventListener('mouseup', finishDrag);
document.addEventListener('mouseleave', finishDrag);

container.addEventListener('click', (event) => {
  const noteEl = event.target.closest('.sticky-note');
  if (!noteEl || draggedNote) return;

  maxZ += 1;
  noteEl.style.zIndex = String(maxZ);
  const note = notes.find((item) => item.id === noteEl.dataset.id);
  if (note) {
    note.zIndex = maxZ;
    persistPosition(note);
  }
});

async function init() {
  if (!isGuestbookConfigured()) {
    showConfigError();
    return;
  }

  try {
    notes = await listNotes();
    renderNotes();
  } catch {
    showError('加载留言失败，请稍后再试');
    emptyMessage.textContent = '加载留言失败';
    emptyMessage.style.display = 'flex';
  }
}

init();
