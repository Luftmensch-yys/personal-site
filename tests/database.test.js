import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { createDatabase, asRole, legacyId } from './database.js';

const createSql = 'select * from public.create_sticky_note($1,$2,$3,$4,$5,$6,$7,$8,$9)';
const params = (id, token) => [id, token, '访客', '测试便签', 'pink', 0, 20, 20, 1];

test('migration preserves legacy rows and enforces per-note credentials with real PostgreSQL roles', async () => {
  const db = await createDatabase();
  try {
    const before = (await db.query('select * from sticky_notes')).rows;
    assert.deepEqual(before, db.legacySnapshot);
    const migration = await readFile(new URL('../supabase/migrations/20260916_note_delete_tokens.sql', import.meta.url), 'utf8');
    await db.exec(migration); // repeatable, including policy and grants
    assert.deepEqual((await asRole(db, 'select * from sticky_notes')).rows, before);
    assert.equal((await db.query('select * from guestbook_private.note_ownership')).rows.length, 0);

    const id = randomUUID(), secondId = randomUUID();
    const token = 'a'.repeat(64), otherToken = 'b'.repeat(64);
    await asRole(db, createSql, params(id, token));
    await asRole(db, createSql, params(secondId, otherToken));
    const hash = (await db.query("select encode(token_hash, 'hex') as hash from guestbook_private.note_ownership where note_id=$1", [id])).rows[0].hash;
    assert.equal(hash, createHash('sha256').update(token).digest('hex'));
    assert.ok(!(await asRole(db, 'select * from sticky_notes')).fields.some((f) => /token|hash/.test(f.name)));
    for (const wrong of [null, '', 'wrong', otherToken]) {
      await assert.rejects(asRole(db, 'select delete_sticky_note($1,$2)', [id, wrong]), { code: '42501' });
    }
    await assert.rejects(asRole(db, 'select delete_sticky_note($1,$2)', [secondId, token]), { code: '42501' });
    await assert.rejects(asRole(db, 'select delete_sticky_note($1,$2)', [legacyId, token]), { code: '42501' });
    await assert.rejects(asRole(db, createSql, params(legacyId, token)), { code: '23505' });
    await assert.rejects(asRole(db, createSql, params(id, otherToken)), { code: '23505' });
    await assert.rejects(asRole(db, 'delete from sticky_notes where id=$1', [id]), { code: '42501' });
    await assert.rejects(asRole(db, "insert into sticky_notes(name,content) values ('bad','bypass')"), { code: '42501' });
    await assert.rejects(asRole(db, "update sticky_notes set content='changed' where id=$1", [id]), { code: '42501' });
    await assert.rejects(asRole(db, 'select * from guestbook_private.note_ownership'), { code: '42501' });
    await assert.rejects(asRole(db, 'select delete_sticky_note($1,$2)', [id, token], 'authenticated'), { code: '42501' });
    await assert.rejects(asRole(db, 'select delete_sticky_note($1,$2)', [id, token], 'visitor'), { code: '42501' });

    await asRole(db, 'select update_sticky_note_position($1,0,0,200)', [legacyId]);
    assert.equal((await db.query('select pos_left from sticky_notes where id=$1', [legacyId])).rows[0].pos_left, 0);
    await asRole(db, 'select delete_sticky_note($1,$2)', [id, token]);
    assert.equal((await db.query('select * from sticky_notes where id=$1', [id])).rows.length, 0);
    assert.equal((await db.query('select * from guestbook_private.note_ownership where note_id=$1', [id])).rows.length, 0);
    assert.equal((await db.query('select * from sticky_notes where id=$1', [legacyId])).rows.length, 1);
    assert.equal((await db.query('select * from sticky_notes where id=$1', [secondId])).rows.length, 1);
    const functions = (await db.query("select prosecdef,proconfig from pg_proc where proname in ('create_sticky_note','delete_sticky_note','update_sticky_note_position')")).rows;
    assert.equal(functions.length, 3);
    assert.ok(functions.every((f) => f.prosecdef && f.proconfig.includes('search_path=""')));
  } finally { await db.close(); }
});

test('fresh schema installs the same RPCs and invalid creates are atomic', async () => {
  const db = await createDatabase({ fresh: true });
  try {
    const id = randomUUID();
    await assert.rejects(asRole(db, createSql, params(id, 'short')), { code: '22023' });
    const invalid = params(id, 'c'.repeat(64)); invalid[3] = '';
    await assert.rejects(asRole(db, createSql, invalid), { code: '23514' });
    assert.equal((await db.query('select * from sticky_notes')).rows.length, 0);
    assert.equal((await db.query('select * from guestbook_private.note_ownership')).rows.length, 0);
  } finally { await db.close(); }
});
