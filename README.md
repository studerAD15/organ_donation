# Blood & Organ Donation Portal

Full-stack portal connecting verified blood/organ donors and hospitals with urgency-aware, proximity-based matching, real-time notifications, and admin controls.

## New Improvements Implemented

1. Verification hardening
- Donor verification workflow: `pending -> approved/rejected`
- ID duplicate detection using hashed document payloads
- Hospital registry status (`validated/pending/rejected`) with validation notes

2. Matching quality upgrades
- Donation cooldown eligibility filters (blood/organ)
- Response-likelihood scoring from donor acceptance history
- Critical-wave donor cascade notifications

3. Emergency reliability
- Multi-channel escalation: in-app + SMS + email fallback + optional voice fallback
- Donor acknowledgement flow (`accepted/declined/no_response`) for request invites

4. Privacy and trust
- Tokenized contact reveal with expiry (only authorized users)
- Hash-chain audit log entries for tamper-evident request lifecycle changes

5. Ops and safety
- Dependency-aware health endpoint (`/api/health`) for DB/Twilio/Cloudinary/SMTP status
- OTP abuse throttling by phone + IP + device fingerprint header
- Request fraud scoring and auto flags (`review_required` etc.)

6. Hospital UX
- Request templates (save/apply)
- Quick critical request action
- Map filters by blood group/city/radius

7. Admin intelligence
- SLA metrics: average minutes to match/fulfill
- City heatmap + shortage forecast
- Campaign suggestion API based on active shortage clusters

8. Technical reliability
- In-process async queue for non-blocking alert dispatch
- TTL caching for request board and map queries

9. Clinical completeness
- Donation outcome notes + admin verification timestamp
- Consent version captured in donation/user metadata

## Stack

- Frontend: React + Vite + Tailwind + React Router + Axios + Socket.io-client + Google Maps + Chart.js
- Backend: Node.js + Express + MongoDB (Mongoose) + Socket.io + JWT auth
- Notifications: Twilio SMS/Verify + Nodemailer fallback + optional Twilio voice
- Storage: Cloudinary (ID proofs)
- Scheduler: node-cron (request expiry)

## API Highlights

### Auth
- `POST /api/auth/register`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Requests and Matching
- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/mine`
- `GET /api/requests/donor-feed`
- `POST /api/requests/:id/match`
- `POST /api/requests/:id/respond`
- `PATCH /api/requests/:id/status`
- `GET /api/requests/:id/contact?token=...`

### Request Templates
- `GET /api/requests/templates/mine`
- `POST /api/requests/templates`

### Admin
- `GET /api/admin/verifications`
- `PATCH /api/admin/verifications/:id`
- `GET /api/admin/analytics`
- `GET /api/admin/requests`
- `PATCH /api/admin/requests/:id/override`
- `GET /api/admin/audit/:requestId`
- `GET /api/admin/campaign-suggestions`

### Ops
- `GET /api/health`

## Setup

1. Install dependencies
```bash
npm install
```

2. Configure env files
```bash
cp .env.example .env
cp client/.env.example client/.env
```

3. Run app
```bash
npm run dev
```

4. Seed demo data
```bash
npm run seed
```

## Environment Notes

Required for full production behavior:
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL`

Twilio fields:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_VOICE_WEBHOOK_URL` (optional for call fallback)

## Deployment

### Vercel (Frontend)

1. Import GitHub repo into Vercel.
2. Set **Root Directory** to `client`.
3. Vercel build settings:
```bash
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```
4. Add environment variables in Vercel:
```bash
VITE_API_URL=https://<your-render-api-domain>/api
VITE_SOCKET_URL=https://<your-render-api-domain>
VITE_GOOGLE_MAPS_API_KEY=<your_key>
```
5. `client/vercel.json` already includes SPA rewrite support.

### Render (Backend)

`render.yaml` is included at repo root with service defaults:
- `rootDir: server`
- `buildCommand: npm install`
- `startCommand: npm start`
- `healthCheckPath: /api/health`

Deploy options:
1. **Blueprint deploy**: Create new Blueprint in Render and select this repo.
2. **Manual deploy**: Create a Node Web Service with root directory `server` and same build/start commands.

Required environment variables on Render:
- `CLIENT_URL` (your Vercel frontend URL)
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional integrations (only if used):
- Twilio (`TWILIO_*`)
- Cloudinary (`CLOUDINARY_*`)
- SMTP (`SMTP_*`)
- `GOOGLE_MAPS_API_KEY`

### Database

Use MongoDB Atlas for production (`MONGO_URI`).

## Notes

- OTP is never returned to the browser. Configure Twilio (`TWILIO_VERIFY_SERVICE_SID` for Verify, or at minimum `TWILIO_PHONE_NUMBER` for SMS) to deliver OTPs to the user's mobile number.
- Public request board redacts contact details.
- Contact reveal requires both authorization and valid token/expiry.
