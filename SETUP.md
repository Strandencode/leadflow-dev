# LeadFlow — Setup & Deployment Guide

## Quick Start (Demo Mode)

The app works immediately in demo mode without any external services:

```bash
cd leadflow-app
npm install
npm run dev
```

Open http://localhost:5173 — sign in with any email/password and it runs fully in demo mode.

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Click **"New Project"**
3. Give it a name (e.g. `leadflow`) and set a database password
4. Wait ~2 minutes for the project to provision
5. Go to **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Step 2: Set Up Database

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **"Run"**

This creates all tables: profiles, ICP profiles, saved searches, email templates, and saved leads — with Row Level Security so each user only sees their own data.

## Step 3: Configure Auth

1. In Supabase, go to **Authentication → Providers**
2. **Email** is enabled by default — that's all you need to start
3. Optional: Go to **Authentication → URL Configuration** and set:
   - Site URL: `http://localhost:5173` (for dev) or your Vercel domain (for prod)

## Step 4: Add Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase credentials:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...your-key-here
```

## Step 5: Run Locally

```bash
npm run dev
```

Now signup and login work with real Supabase authentication!

---

## Deploy to Vercel

### Option A: Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Then add environment variables:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Option B: Via Vercel Dashboard

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial LeadFlow app"
   git remote add origin https://github.com/YOUR_USER/leadflow.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
5. Click **Deploy**

Your app will be live at `https://leadflow-xxxx.vercel.app`

### After Deploy: Update Supabase Auth URL

Go to Supabase → Authentication → URL Configuration and add your Vercel URL to:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

---

## Project Structure

```
leadflow-app/
├── src/
│   ├── api/
│   │   └── brreg.js          # Brønnøysund API integration
│   ├── components/
│   │   └── Sidebar.jsx        # Navigation sidebar
│   ├── hooks/
│   │   └── useAuth.jsx        # Auth context (Supabase + demo mode)
│   ├── lib/
│   │   └── supabase.js        # Supabase client config
│   ├── pages/
│   │   ├── LoginPage.jsx      # Login / signup
│   │   ├── DashboardPage.jsx  # Stats overview
│   │   ├── SearchPage.jsx     # Lead search (Brreg API)
│   │   ├── ICPPage.jsx        # ICP builder form
│   │   ├── EmailPage.jsx      # Email template editor
│   │   ├── SavedPage.jsx      # Saved search lists
│   │   └── SettingsPage.jsx   # Profile & subscription
│   ├── App.jsx                # Routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind + global styles
├── supabase-schema.sql         # Database tables & RLS
├── vercel.json                 # SPA routing for Vercel
├── .env.example                # Environment template
└── tailwind.config.js          # Tailwind theme
```

---

## What's Working Now

✅ Full authentication (signup/login/logout) with Supabase  
✅ Demo mode when Supabase isn't configured  
✅ Live Brreg API search — real Norwegian company data  
✅ Contact person lookup via Brreg roles API  
✅ CSV export of search results  
✅ ICP builder with local save  
✅ Email template editor with merge fields + live preview  
✅ Simulated AI email generation (ready for Claude API)  
✅ Saved lists page  
✅ Settings with subscription/pricing display  
✅ Responsive sidebar navigation  

## Next Steps to Add

1. **Stripe Payments** — Add `npm install @stripe/stripe-js` and create checkout sessions
2. **Claude API for email generation** — Replace the mock in EmailPage with real API call
3. **Save to Supabase** — Wire ICP, templates, and searches to the database tables
4. **Email enrichment** — Add Hunter.io or similar API for email/phone lookup
5. **Email sending** — Integrate Resend or SendGrid to send outreach from the app
