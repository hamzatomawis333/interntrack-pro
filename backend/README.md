# OJT Attendance — Backend (Express + MySQL)

A REST API for the OJT Attendance Tracking System. Designed to run alongside
**XAMPP** (MySQL via phpMyAdmin) on your local machine.

## 1. Prerequisites

- **Node.js 18+** (https://nodejs.org)
- **XAMPP** with the **MySQL (MariaDB)** module running

## 2. Install

```bash
cd backend
npm install
cp .env.example .env
# edit .env if your MySQL user/password differ from XAMPP defaults
```

Default `.env` values match a fresh XAMPP install (`root` / empty password).

## 3. Create the database

**Option A — via phpMyAdmin (recommended for XAMPP):**

1. Start Apache + MySQL in the XAMPP control panel.
2. Open http://localhost/phpmyadmin
3. Click the **Import** tab.
4. Choose `backend/schema.sql` and click **Go**.

**Option B — via script:**

```bash
x
```

This creates a database named `ojt_attendance` with three tables
(`users`, `attendance`, `manual_attendance`) and seeds the default admin.

### Default admin account

| Field    | Value   |
| -------- | ------- |
| Username | `admin` |
| Password | `admin` |

The admin will be forced to change this password on first login.

## 4. Run the API

```bash
npm run dev    # auto-reload on changes
# or
npm start
```

The server listens on **http://localhost:5000** by default.

Health check: http://localhost:5000/api/health

## 5. Connect the frontend

The frontend (React app at the project root) calls
`http://localhost:5000/api` by default.

To override, create a `.env` file at the **project root** (not `/backend`):

```env
VITE_API_URL=http://localhost:5000/api
```

Then run the frontend:

```bash
# from the project root
npm install
npm run dev
```

Set `CORS_ORIGIN` in `backend/.env` to the URL your frontend runs on (Vite's
default is `http://localhost:5173`).

## API summary

```
POST   /api/auth/login                { username, password, role }
POST   /api/auth/register             intern self-registration
POST   /api/auth/change-password      authed
GET    /api/auth/me                   authed

POST   /api/attendance/time-in        intern, weekdays only, 1×/day
POST   /api/attendance/time-out       intern, after time-in
GET    /api/attendance/summary        intern dashboard data
GET    /api/attendance/history        intern + weekly Mon–Fri
POST   /api/attendance/manual         intern, back-fill logbook entry
GET    /api/attendance/calendar       ?year=&month=

GET    /api/admin/stats               admin overview
GET    /api/admin/attendance          filters: name, date, month
GET    /api/admin/reports             per-intern required/rendered
GET    /api/admin/interns             list intern accounts
PATCH  /api/admin/interns/:id         update required_hours
DELETE /api/admin/interns/:id         remove intern + attendance
```

## Notes

- Passwords are hashed with **bcrypt** (cost 10).
- Auth uses a **JWT** (`Authorization: Bearer …`), 7-day expiry.
- All timestamps are server-local time.
- Weekends are rejected by the API for `time-in` / `time-out`.
