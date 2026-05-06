# IOTA KYC Platform

Turborepo monorepo — React Native mobile app + Next.js web portal + FastAPI backend.

## Structure

```
iotakyc/
├── apps/
│   ├── mobile/          React Native (Expo) — customer self-onboarding app
│   └── web/             Next.js 14 — bank agent review portal
├── packages/
│   └── core/            Shared types, Zod schemas, API client
├── backend/             FastAPI — KYC sessions, govt API proxy, admin routes
└── supabase_schema.sql  Run this in Supabase SQL editor first
```

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env        # fill in Supabase keys
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Test: `curl http://localhost:8000/ping`

### 2. Mobile App
```bash
cd apps/mobile
npm install
npx expo start
```

### 3. Web Portal
```bash
cd apps/web
npm install
npm run dev    # http://localhost:3000
```

## Environment Variables

**Backend `.env`:**
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` — from Supabase project settings
- `SPOST_API_KEY`, `TKML_API_KEY`, `ELM_API_KEY` — Saudi govt APIs (leave blank for mock mode)

**Mobile `.env`:**
- `EXPO_PUBLIC_API_URL=http://localhost:8000`

**Web `.env.local`:**
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

## KYC Steps

| Step | Screen | Data Source |
|------|--------|-------------|
| 1 | Iqama Entry | User input |
| 2 | Personal Info | Auto-fetch (NIC/Absher API) |
| 3 | National Address | Auto-fetch (SPOST API) |
| 4 | Employment | User input + TKML validation |
| 5 | Financial Info | User input |
| 6 | Contact Info | User input |
| 7 | FATCA/CRS + PEP | User input + ELMNatheer check |
| 8 | Review & Submit | Summary of all steps |

## Mock Mode

All govt APIs run in mock mode when API keys are empty in `.env`.
To test the PEP flow: use iqama `TEST-PEP` — triggers ELMNatheer flag.
