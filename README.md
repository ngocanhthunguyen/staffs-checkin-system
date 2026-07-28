# Staff Check-In System

A mobile-friendly PWA for staff attendance — check in/out, manager dashboard, monthly reports, and correction requests.

Built with **Next.js 15** + **Supabase** (free tier works for 20–30 staff).

## Features

- **Staff**: One-tap check in / check out with optional GPS geofence
- **Manager dashboard**: See who's in, who's out, who hasn't arrived
- **Monthly reports**: Hours per staff + CSV export for payroll
- **Corrections**: Staff request fixes, manager approves/rejects
- **PWA**: Add to home screen on iPhone/Android (no App Store needed)

## Quick start

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** and run the full contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy your URL and anon key

### 2. Configure environment

```bash
cd staff-attendance
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Set up your first users

1. **Create your account** on the login page (Sign up)
2. In Supabase → **Table Editor → profiles**, find your user and set `role` to `admin`
3. Update **sites** table with your office GPS coordinates:
   - `latitude`, `longitude` (get from Google Maps)
   - `geofence_radius_m` (default 150 meters)
4. Assign each staff member a `site_id` in their profile (or leave null to skip GPS check)
5. Share the login URL with your team — they create their own accounts

### 5. Add to phone home screen

**iPhone (Safari):** Share → Add to Home Screen  
**Android (Chrome):** Menu → Add to Home Screen / Install app

## User roles

| Role | Access |
|------|--------|
| `staff` | Check in/out, own history, request corrections |
| `manager` | + Dashboard, reports, approve corrections, team view |
| `admin` | Same as manager |

Change roles in Supabase → `profiles` table → `role` column.

## Office location (geofence)

Edit the `sites` table in Supabase:

```sql
update sites set
  latitude = 13.7563,   -- your office lat
  longitude = 100.5018, -- your office lng
  geofence_radius_m = 150
where name = 'Main Office';
```

Staff assigned to that site must be within the radius to check in. Set `site_id = null` on a profile to disable GPS for that person.

## Deploy to production (free)

### Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy — share the URL with staff

### Supabase auth redirect

In Supabase → **Authentication → URL Configuration**, add your production URL to **Site URL** and **Redirect URLs**.

## Project structure

```
src/
  app/
    page.tsx          # Check in/out (home)
    login/            # Sign in / sign up
    dashboard/        # Manager: who's in today
    reports/          # Manager: monthly hours + CSV
    history/          # Staff: last 30 days
    corrections/      # Correction requests
    team/             # Manager: staff list
    actions/          # Server actions
  components/         # UI components
  lib/supabase/       # Supabase clients
supabase/
  schema.sql          # Database schema + RLS policies
```

## Cost

| Service | Cost for ~30 staff |
|---------|-------------------|
| Supabase | $0 (free tier) |
| Vercel | $0 (free tier) |
| Domain (optional) | ~$10/year |

## What's next (Phase 2)

- Face recognition check-in
- Push notifications (forgot to check out)
- App Store / Play Store (Capacitor wrapper)

## License

Private — internal company use.
