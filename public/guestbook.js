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
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
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
  const rows = await supabaseRequest('sticky_notes?select=*&order=created_at.desc');
  return (rows ?? []).map(mapNoteFromDb);
}

export async function createNote({ name, content, color, rotate, left, top, zIndex }) {
  const rows = await supabaseRequest('sticky_notes', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      name,
      content,
      color,
      rotate,
      pos_left: left,
      pos_top: top,
      z_index: zIndex,
    },
  });

  return mapNoteFromDb(rows[0]);
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
