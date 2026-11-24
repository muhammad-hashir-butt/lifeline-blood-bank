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
- `VITE_API_URL` — default `http://localhost:5000/api`

**Backend (`server/.env`)**
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`
- `EMAIL_FROM`
