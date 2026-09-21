const COLORS = ['pink', 'green', 'blue', 'purple', 'orange'];

function getConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
  };
}

export function isGuestbookConfigured() {
  const { url, key } = getConfig();
  return Boolean(url && key);
}

function mapNoteFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    color: row.color,
    rotate: row.rotate,
    left: row.pos_left,
    top: row.pos_top,
    zIndex: row.z_index,
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function supabaseRequest(path, { method = 'GET', body, prefer } = {}) {
  const { url, key } = getConfig();
  if (!url || !key) {
    throw new Error('Guestbook is not configured');
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    // Never surface server details that might contain a request credential.
    const error = new Error(`Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function pickColor(index = 0) {
  return COLORS[index % COLORS.length];
}

export function randomPosition(containerWidth = 900, containerHeight = 600) {
  return {
    left: Math.max(20, Math.floor(Math.random() * (containerWidth - 320))),
    top: Math.max(20, Math.floor(Math.random() * (containerHeight - 220))),
  };
}

export async function listNotes() {
  // Retry one transient read failure, never a write (which might have committed).
  for (let attempt = 0; ; attempt++) {
    try {
      const rows = await supabaseRequest('sticky_notes?select=id,name,content,color,rotate,pos_left,pos_top,z_index,created_at&order=created_at.desc');
      if (!Array.isArray(rows)) throw new Error('Invalid guestbook response');
      return rows.map(mapNoteFromDb);
    } catch (error) {
      if (attempt || !(error instanceof TypeError || error.status === 502 || error.status === 503 || error.status === 504)) throw error;
    }
  }
}

function ownershipKey(id) {
  return `guestbook:delete:v1:${getConfig().url}:${id}`;
}

export function hasDeleteToken(id) {
  try {
    return /^[a-f0-9]{64}$/.test(localStorage.getItem(ownershipKey(id)) ?? '');
  } catch {
    return false;
  }
}

export async function createNote({ name, content, color, rotate, left, top, zIndex }) {
  const id = crypto.randomUUID();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  // Persist before sending: an interrupted response may still have committed.
  // One key per note avoids losing credentials in concurrent browser tabs.
  try {
    localStorage.setItem(ownershipKey(id), token);
    if (localStorage.getItem(ownershipKey(id)) !== token) throw new Error();
  } catch {
    throw new Error('浏览器无法保存删除凭证，请允许此网站使用本地存储后再发布');
  }
  const rows = await supabaseRequest('rpc/create_sticky_note', {
    method: 'POST',
    body: {
      note_id: id,
      owner_token: token,
      note_name: name,
      note_content: content,
      note_color: color,
      note_rotate: rotate,
      note_left: left,
      note_top: top,
      note_z_index: zIndex,
    },
  });

  return mapNoteFromDb(rows[0]);
}

export async function deleteNote(id) {
  const token = localStorage.getItem(ownershipKey(id));
  if (!token) throw new Error('此浏览器没有这张便签的删除凭证');
  await supabaseRequest('rpc/delete_sticky_note', {
    method: 'POST',
    body: { note_id: id, owner_token: token },
  });
  // Once the server has deleted the note, a storage failure must not undo UI success.
  try { localStorage.removeItem(ownershipKey(id)); } catch { /* harmless stale token */ }
}

export async function updatePosition(id, left, top, zIndex) {
  await supabaseRequest('rpc/update_sticky_note_position', {
    method: 'POST',
    body: {
      note_id: id,
      new_pos_left: left,
      new_pos_top: top,
      new_z_index: zIndex,
    },
  });
}
