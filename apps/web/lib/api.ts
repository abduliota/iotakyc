// Central API URL — reads from environment variable
// Set NEXT_PUBLIC_API_URL in:
//   - Render dashboard → Environment Variables
//   - apps/web/.env.local (local dev)
//   - apps/web/.env.production (production fallback)

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://iotakyc.onrender.com'