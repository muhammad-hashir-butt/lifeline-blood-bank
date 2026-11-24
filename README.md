# Lifeline Blood Bank

Blood bank operations portal with role-based access for **Admin**, **Hospital**, **NGO**, and **Donor**.

Stack:
- **Frontend:** React + Vite + Tailwind + Poppins
- **Backend:** Node.js + Express + MongoDB
- **Auth:** JWT
- **Alerts:** Nodemailer (email)

> Supabase (hobby) client is commented out and replaced by the custom API.

## Roles

| Role | Sees | Can do |
|------|------|--------|
| Admin | Everything | Full CRUD, alerts, forecast |
| Hospital | Nationwide inventory (view), city donors | Manage own hospital stock, requests, alerts |
| NGO | City inventory + donors | Manage city stock/requests/alerts |
| Donor | Nationwide inventory (view), own profile | View only (no stock/request create) |

## Quick start

### 1) Backend

```bash
cd server
cp .env.example .env
# fill MONGODB_URI, JWT_SECRET, SMTP_*
yarn install
yarn seed:users
yarn dev
```

API runs at `http://localhost:5000`.

### 2) Frontend

```bash
# from project root
cp .env.example .env   # optional; defaults to localhost:5000
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Seed logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lifeline.com` | `admin123` |
| Donor | `donor@lifeline.com` | `donor123` |
| Hospital | `hospital@lifeline.com` | `hospital123` |
| NGO | `ngo@lifeline.com` | `ngo123` |

## Useful scripts

```bash
# frontend
npm run dev
npm run build

# backend
cd server
yarn dev
yarn seed:users
yarn seed:admin
```

## Environment

**Frontend (`.env`)**
- Local: leave `VITE_API_URL` unset (defaults to `http://localhost:5000/api`)
- Vercel: leave `VITE_API_URL` **unset** so the app uses same-origin `/api` (fixes CORS)

**Backend (`server/.env` locally / Vercel Project Env for production)**
- `MONGODB_URI` — **required on Vercel** (use MongoDB Atlas, not localhost)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_ORIGINS` — optional; Vercel app origins are allowed by default
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`
- `EMAIL_FROM`

### Vercel deploy notes
1. Push this repo and redeploy
2. In Vercel → Project → Settings → Environment Variables, add at least:
   - `MONGODB_URI` (Atlas connection string with DB name)
   - `JWT_SECRET`
   - SMTP vars if you want real emails
3. Do **not** set `VITE_API_URL` to localhost on Vercel
4. Redeploy after saving env vars
5. Run seed once against Atlas (local machine with Atlas URI): `cd server && yarn seed:users`
