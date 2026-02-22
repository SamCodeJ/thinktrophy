# ThinkTrophy 🏆
> **Think Sharp. Win Big.**

A full-stack money-staking trivia gaming platform where players stake real money, answer 10 timed trivia questions across 5 chosen categories, and win multiplied payouts based on performance.

---

## Architecture

```
thinktrophy/
├── backend/        # Node.js/Express REST API + PostgreSQL
├── web-admin/      # React.js Admin Portal (Vite + Tailwind)
└── mobile/         # React Native / Expo Player App
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm 9+

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and secrets
npm run migrate
npm run seed
npm run dev
```

### 2. Web Admin Portal

```bash
cd web-admin
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

---

## Game Mechanics

| Score | Payout |
|-------|--------|
| 10/10 | 2× stake (net profit = stake) |
| 9/10  | 1.5× stake (net profit = 0.5× stake) |
| ≤ 8/10 | $0 (stake lost) |

- 10 questions from 5 chosen categories (2 per category)
- 50-second total session timer
- Adaptive difficulty: if 5/5 correct on Q1–5, Q6–10 become Hard only
- Server-side anti-cheat: answers validated server-side, session tokens, timing checks

---

## Security Features

- RS256 asymmetric JWTs (15min access + refresh token rotation)
- Server-side game session validation with timing enforcement
- One active session per user
- Answer options served as opaque UUIDs (shuffled per session)
- Payment verified before game session created
- bcrypt password hashing (salt rounds: 12)
- Helmet.js, CORS, rate limiting on auth endpoints

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:password@localhost:5432/thinktrophy
JWT_PRIVATE_KEY=<RS256 private key base64>
JWT_PUBLIC_KEY=<RS256 public key base64>
JWT_REFRESH_SECRET=<random 64-char string>
PAYMENT_GATEWAY_KEY=<stripe or flutterwave key>
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Generating RSA Keys

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Then base64 encode:
base64 private.pem
base64 public.pem
```

---

## Default Admin Credentials (after seed)
- Email: `admin@thinktrophy.com`
- Password: `Admin@123456`

> ⚠️ Change immediately in production.

---

## API Base URL
`http://localhost:4000/api`
