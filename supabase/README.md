# Guestbook Supabase Setup

The message board on `留言页.html` stores sticky notes in Supabase so all visitors can see them across devices.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Create a new project and wait for the database to finish provisioning.

## 2. Run the schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`schema.sql`](./schema.sql).
3. Run the script.

This creates the `sticky_notes` table, enables RLS, and allows:

- Anonymous `SELECT` and `INSERT`
- Position updates through the `update_sticky_note_position` RPC
- No anonymous delete

## 3. Configure environment variables

1. In Supabase, open **Project Settings → API**.
2. Copy **Project URL** and **anon public** key.
3. In this repo root, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

4. Fill in the values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Do not commit `.env` (it is already listed in `.gitignore`).

## 4. Run locally

```bash
npm install
npm run dev
```

Open `留言页.html` through the Vite dev server and post a test note.

## 5. Deploy

Set the same `VITE_SUPABASE_*` variables in your static hosting platform before running `npm run build`.

To remove inappropriate notes, use the Supabase **Table Editor** or SQL console (anonymous users cannot delete notes).
