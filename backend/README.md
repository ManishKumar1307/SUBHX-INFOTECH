# Backend Setup Guide

## Overview
This backend is built with Node.js, Express, MongoDB, Redis, and JWT authentication. It provides secure authentication APIs for the Next.js frontend.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud instance)
- Redis (local or cloud instance)

## Installation
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Create a `.env` file in the backend folder with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-db-name
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Running the Server
Start the backend server with:
```bash
npm run dev
```

## API Endpoints
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive tokens
- `POST /api/auth/refresh-token` — Refresh access token
- `GET /api/auth/me` — Get current user info (protected)
- `POST /api/auth/logout` — Logout user

## Notes
- Ensure MongoDB and Redis are running before starting the backend.
- The backend uses Redis for session management, token blacklisting, and rate limiting.
- JWT tokens are used for authentication; refresh tokens are stored as HTTP-only cookies.

## Troubleshooting
- If you see Redis errors, check that your Redis server is running and accessible.
- For MongoDB issues, verify your connection string and database status.

## License
MIT
