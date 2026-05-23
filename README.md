# DevPulse API Manual Testing

Base URL: `http://localhost:5000`

## Quick Start

1. Start the app with `npm run dev`.
2. Make sure PostgreSQL is reachable and `CONNECTIONSTRING` or `DATABASE_URL` is set in `.env`.
3. Use Postman with `Content-Type: application/json` on all JSON requests.
4. For protected routes, send `Authorization: Bearer <accessToken>`.

## Auth

### 1) Signup

- Method: `POST`
- URL: `http://localhost:5000/api/auth/signup`
- Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123!"
}
```

### 2) Login

- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Body:

```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

- Response includes `accessToken`. Copy that token for protected routes.

## Issues

### 3) Get all issues

- Method: `GET`
- URL: `http://localhost:5000/api/issues`
- Optional query params:
  - `sort=newest` or `sort=oldest`
  - `type=bug` or `type=feature_request`
  - `status=open`, `status=in_progress`, or `status=resolved`

Example:

`http://localhost:5000/api/issues?sort=newest&type=bug&status=open`

### 4) Get issue by id

- Method: `GET`
- URL: `http://localhost:5000/api/issues/1`

### 5) Create issue

- Method: `POST`
- URL: `http://localhost:5000/api/issues`
- Authorization: `Bearer <accessToken>`
- Body:

```json
{
  "title": "Login button not working",
  "description": "The login button does not submit the form when clicked in Chrome.",
  "type": "bug"
}
```

### 6) Update issue

- Method: `PATCH`
- URL: `http://localhost:5000/api/issues/1`
- Authorization: `Bearer <accessToken>`
- Body can include any of:

```json
{
  "title": "Updated title",
  "description": "Updated description with at least 20 characters.",
  "type": "feature_request"
}
```

### 7) Delete issue

- Method: `DELETE`
- URL: `http://localhost:5000/api/issues/1`
- Authorization: `Bearer <accessToken>`
- Only `maintainer` role can delete.

## Default Seed Users

If the database initializes successfully, these users are created:

- `maintainer@example.com` / `Password123!`
- `contributor@example.com` / `Password123!`

Use the maintainer account to test delete. Use any signed-in account to test create/update.

## Common Responses

- `200 OK`: successful GET/PATCH/DELETE
- `201 Created`: signup or create issue
- `400 Bad Request`: invalid body or params
- `401 Unauthorized`: missing or invalid token
- `403 Forbidden`: role-based access denied
- `404 Not Found`: issue not found
- `409 Conflict`: duplicate email or contributor update conflict
