import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

export const legacyId = '11111111-1111-4111-8111-111111111111';
export async function createDatabase({ fresh = false } = {}) {
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role visitor; grant usage on schema public to anon, authenticated, visitor;');
  if (fresh) {
    await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
  } else {
    await db.exec(await readFile(new URL('./fixtures/legacy-schema.sql', import.meta.url), 'utf8'));
    await db.query("insert into sticky_notes(id,name,content) values ($1,'旧访客','历史便签')", [legacyId]);
    db.legacySnapshot = (await db.query('select * from sticky_notes')).rows;
    await db.exec(await readFile(new URL('../supabase/migrations/20260916_note_delete_tokens.sql', import.meta.url), 'utf8'));
  }
  return db;
}

export async function asRole(db, sql, params = [], role = 'anon') {
  await db.exec(`set role ${role}`);
  try { return await db.query(sql, params); }
  finally { await db.exec('reset role'); }
}

export function restFetch(db) {
  // Serialize per-connection SET ROLE, just as separate PostgREST transactions do.
  let queue = Promise.resolve();
  return (url, options = {}) => {
    const request = async () => {
      const path = new URL(url).pathname;
      const body = options.body ? JSON.parse(options.body) : {};
      let result;
      try {
        if (path === '/rest/v1/sticky_notes' && (!options.method || options.method === 'GET')) {
          result = await asRole(db, 'select * from public.sticky_notes order by created_at desc');
        } else if (path === '/rest/v1/rpc/create_sticky_note') {
          result = await asRole(db, 'select * from public.create_sticky_note($1,$2,$3,$4,$5,$6,$7,$8,$9)', [body.note_id,body.owner_token,body.note_name,body.note_content,body.note_color,body.note_rotate,body.note_left,body.note_top,body.note_z_index]);
        } else if (path === '/rest/v1/rpc/delete_sticky_note') {
          await asRole(db, 'select public.delete_sticky_note($1,$2)', [body.note_id,body.owner_token]);
          return new Response(null, { status: 204 });
        } else if (path === '/rest/v1/rpc/update_sticky_note_position') {
          await asRole(db, 'select public.update_sticky_note_position($1,$2,$3,$4)', [body.note_id,body.new_pos_left,body.new_pos_top,body.new_z_index]);
          return new Response(null, { status: 204 });
        } else {
          return new Response('{}', { status: 404 });
        }
        return Response.json(result.rows);
      } catch (error) {
        return Response.json({ code: error.code }, { status: error.code === '42501' ? 403 : 400 });
      }
    };
    const result = queue.then(request);
    queue = result.catch(() => {});
    return result;
  };
}
