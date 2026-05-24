# Focal

> A minimal, beautiful task manager. Add tasks. Do them. Stay focused.

Built with React, Tailwind CSS, and Supabase. Deployed on Vercel.

---

## Features

- ✦ Add tasks with a single keystroke
- ✦ Complete tasks with a satisfying checkbox
- ✦ Delete tasks on hover
- ✦ Active and completed tasks separated automatically
- ✦ Works offline (local mode) — no backend required to start
- ✦ Supabase backend for cross-device persistence (optional)

---

## Tech Stack

| | Tool | Why |
|---|---|---|
| UI | React 18 + Vite | Fast builds, great DX |
| Styling | Tailwind CSS | Utility-first, ships fast |
| Icons | Lucide React | Clean, consistent icons |
| Backend | Supabase | Postgres + API in minutes |
| Hosting | Vercel | Free, fast, shareable link |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/focal.git
cd focal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally (no backend needed)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Tasks will be saved in your browser.

---

## Connecting Supabase

To persist tasks across devices, connect a Supabase backend.

### Step 1 — Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project → choose a name and region.

### Step 2 — Create the tasks table

In Supabase, go to **SQL Editor** and run:

```sql
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Allow all operations (for MVP — see note on auth below)
alter table tasks enable row level security;
create policy "Allow all" on tasks for all using (true) with check (true);
```

### Step 3 — Add your credentials

```bash
cp .env.example .env
```

Edit `.env` and fill in your values from **Supabase → Settings → API**:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Restart the dev server — tasks now live in Postgres.

---

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Add your environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
4. Click Deploy

Your app will be live at `https://focal-your-name.vercel.app`.

---

## Roadmap (v0.2+)

- [ ] Due dates
- [ ] Task priority (low / medium / high)
- [ ] Keyboard shortcuts
- [ ] User authentication (Supabase Auth)
- [ ] Multiple lists / projects

---

## Author

Built by [Paweł Stawski](https://github.com/your-username) as part of a product builder journey.

---

## License

MIT
