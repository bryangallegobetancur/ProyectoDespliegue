# Data Quality Dashboard

PoC app for defining and running data quality rules against Supabase tables. Built with React 19 + TypeScript + Vite + Supabase.

## Stack

- **Frontend:** React 19, TypeScript, Vite, react-router-dom v7, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Styling:** CSS custom properties, dark theme, responsive

## Features

- Email/password authentication (Login + Register)
- Create quality rules: NOT_NULL, UNIQUE, RANGE, VALUE_IN_SET, REGEX_MATCH, STRING_LENGTH, CUSTOM_QUERY
- Run checks against any Supabase table
- Dashboard with stats, severity pie chart, and pass/fail bar chart
- Recent run history table

## Getting Started

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the database schema

In your Supabase project, open the **SQL Editor** and execute the contents of `src/lib/schema.sql`. This creates:

- `profiles` table (linked to `auth.users`)
- `quality_rules` table with RLS policies
- `rule_checks` table with RLS policies
- `exec_sql` RPC function (used by CUSTOM_QUERY rules)

### 3. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication > Settings**
2. Under "Email Auth", disable **Confirm email** (so users can sign up without email confirmation for this PoC)
3. Go to **Authentication > Users** — you should see users appear after signup

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase dashboard under **Settings > API**.

### 5. Install dependencies and run

```bash
npm install
npm run dev
```

The app should open at `http://localhost:5173`.

### 6. Build for production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Navbar + sidebar layout
│   ├── ProtectedRoute.tsx  # Auth gate
│   ├── RuleCard.tsx        # Rule display + Run Check
│   ├── StatsOverview.tsx   # Dashboard charts
│   └── RunHistory.tsx      # Recent runs table
├── contexts/
│   └── AuthContext.tsx     # Auth state management
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── schema.sql          # DB schema for Supabase SQL Editor
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Rules.tsx
│   └── NewRule.tsx
└── types/
    └── index.ts            # TypeScript types and constants
```

## Deployment (Cloud)

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel dashboard.

### Deploy to Netlify

```bash
npm run build
```

1. Drag `dist/` to Netlify or connect your Git repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Deploy to Cloudflare Pages

```bash
npm run build
```

1. Go to Cloudflare Dashboard > Pages
2. Connect your Git repo
3. Build command: `npm run build`
4. Build output: `dist`
5. Add environment variables in Cloudflare dashboard

## Notes

- This is a **Proof of Concept**. The check logic runs on the client side by fetching all rows — not suitable for large tables.
- CUSTOM_QUERY rules use a Supabase RPC function (`exec_sql`) that allows running arbitrary SELECT queries. Enable it only if needed and restrict access in production.
- UNIQUE checks detect duplicates within the fetched dataset (client-side). For a production app, use a database-level constraint or a Postgres function.
