# AmCart Auth Microservice

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                  │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │  Login    │   │  Register    │   │  Dashboard          │ │
│  │  Page     │   │  Page        │   │  (Protected Route)  │ │
│  └────┬─────┘   └──────┬───────┘   └──────────┬──────────┘ │
│       │                │                       │            │
│       └────────┬───────┘                       │            │
│                ▼                               │            │
│  ┌──────────────────────┐                      │            │
│  │  Firebase Auth SDK   │◄─────────────────────┘            │
│  │  (Client-side)       │                                   │
│  │  • signInWithEmail   │                                   │
│  │  • signInWithGoogle  │                                   │
│  └──────────┬───────────┘                                   │
│             │ Firebase ID Token                             │
│             ▼                                               │
│  ┌──────────────────────┐     ┌──────────────────────────┐  │
│  │  AuthProvider         │────▶│  Axios Interceptor       │  │
│  │  (React Context)     │     │  (Attaches Bearer Token) │  │
│  └──────────────────────┘     └──────────┬───────────────┘  │
└──────────────────────────────────────────┼──────────────────┘
                                           │
                            REST API (Bearer Token)
                                           │
┌──────────────────────────────────────────┼──────────────────┐
│                    BACKEND (NestJS)       │                  │
│                                          ▼                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Auth Module                          │ │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │  FirebaseGuard    │  │  Auth Controller            │ │ │
│  │  │  (Validates       │  │  POST /auth/sync            │ │ │
│  │  │   ID Tokens)      │  │  GET  /auth/profile         │ │ │
│  │  └──────────────────┘  └─────────────────────────────┘ │ │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │  Firebase Admin   │  │  Auth Service               │ │ │
│  │  │  SDK (Server)     │  │  (Token verify + user sync) │ │ │
│  │  └──────────────────┘  └─────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                              │
│                              ▼                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   User Module                          │ │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │  User Entity      │  │  User Service               │ │ │
│  │  │  (TypeORM)        │  │  (CRUD Operations)          │ │ │
│  │  └──────────────────┘  └─────────────────────────────┘ │ │
│  └────────────────────────────┬───────────────────────────┘ │
│                               │                             │
│                               ▼                             │
│                    ┌─────────────────────┐                  │
│                    │   PostgreSQL 15      │                  │
│                    │   (users table)      │                  │
│                    └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Auth Flow

1. **User signs up / logs in** via Firebase on the frontend (Email or Google)
2. **Firebase returns an ID token** to the client
3. **Frontend sends the ID token** as `Authorization: Bearer <token>` to the backend
4. **NestJS FirebaseAuthGuard** intercepts the request and verifies the token via Firebase Admin SDK
5. **Auth Service** syncs the user to PostgreSQL (upsert by Firebase UID)
6. **Protected routes** use the same guard — no session management needed

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15
- Firebase project with Email/Password and Google providers enabled

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Enable Authentication
3. Enable **Email/Password** and **Google** sign-in providers
4. Get your **Web App config** (for frontend)
5. Generate a **Service Account key** (for backend): Project Settings → Service Accounts → Generate New Private Key

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill in values
cp .env.example .env
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
# Copy .env.example to .env.local and fill in Firebase config
cp .env.example .env.local
npm run dev
```

## API Endpoints

| Method | Endpoint        | Auth     | Description                          |
|--------|----------------|----------|--------------------------------------|
| POST   | /auth/sync     | Firebase | Sync Firebase user to local DB       |
| GET    | /auth/profile  | Firebase | Get current user profile             |
| GET    | /health        | None     | Health check                         |
