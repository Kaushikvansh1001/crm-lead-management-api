# CRM Lead Management API

Node.js REST API for employee authentication and customer enquiry management.

## Requirements

- Node.js 20
- PostgreSQL 18, with `psql` available in the terminal

Confirmed on this machine: Node.js v20.16.0 and npm 10.8.1.

## Setup

From `crm-backend`:

```powershell
cd "C:\Users\91971\Desktop\New folder\Developer-Assignment\crm-backend"
npm install
```

Copy the environment template if `.env` does not exist yet:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL password. Do not commit `.env`. If the password contains `@`, encode it as `%40`.

```text
postgresql://postgres:YOUR_PASSWORD@localhost:5432/crm_assignment
```

If this terminal cannot find `psql`, add the PostgreSQL 18 bin folder for the current session:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
```

## Database initialization

Create the database, then apply the schema:

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE crm_assignment;"
psql -U postgres -h localhost -d crm_assignment -f database/schema.sql
```

`database/schema.sql` creates:

- `employees` — name, email, bcrypt password hash, role (`admin` or `employee`)
- `enquiries` — student lead details. `claimed_by` is null while the enquiry is public, and holds an employee id after it is claimed

The script is safe to run again. It does not delete existing rows.

## Start

```powershell
npm run dev
```

Production start, without automatic reload:

```powershell
npm start
```

The API listens on `PORT` from `.env` (default `5000`).

## Verify

With the server running:

```powershell
curl.exe http://localhost:5000/api/health
```

- `200` and `"database": "connected"` means PostgreSQL accepted the connection.
- `503` and `"database": "unreachable"` means the server is up and the database connection failed. Check that PostgreSQL is running, `crm_assignment` exists, and `DATABASE_URL` has the correct password.

## Authentication

`JWT_SECRET` and `JWT_EXPIRES_IN` come from `.env`. Passwords are hashed with bcrypt (12 salt rounds) and are never returned.

Register an employee:

`POST http://localhost:5000/api/auth/register`

```json
{
  "name": "Alex Morgan",
  "email": "alex.morgan@example.com",
  "password": "Password@123"
}
```

Log in:

`POST http://localhost:5000/api/auth/login`

```json
{
  "email": "alex.morgan@example.com",
  "password": "Password@123"
}
```

A successful response includes `employee` and `accessToken`. Send the token on later requests as `Authorization: Bearer <accessToken>`. The employee id is taken from the verified token, not from the request body.

## Enquiries

Anyone can submit an enquiry. Only a logged-in employee can list the public ones.

`POST http://localhost:5000/api/enquiries/public`

No token. `claimed_by` from the body is ignored and stored as null.

```json
{
  "name": "Alex Morgan",
  "email": "alex.morgan@example.com",
  "phone": "9876543210",
  "course_interest": "Full Stack Development",
  "message": "Interested in course admission"
}
```

`201` returns the created enquiry.

`GET http://localhost:5000/api/enquiries/public?page=1&limit=10`

Header: `Authorization: Bearer <accessToken>`.

Returns unclaimed enquiries, newest first. `page` defaults to 1. `limit` defaults to 10 and cannot be higher than 100.

`POST http://localhost:5000/api/enquiries/1/claim`

Header: `Authorization: Bearer <accessToken>`. No body. The employee id comes from the token. `200` returns the enquiry with `claimed_by` set. A missing enquiry returns `404`. An enquiry that is already claimed returns `409`.

`GET http://localhost:5000/api/enquiries/my?page=1&limit=10`

Header: `Authorization: Bearer <accessToken>`. Returns only enquiries claimed by that employee, newest first.
