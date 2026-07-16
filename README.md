# Warmer Kiwi Homes Eligibility Checker

A Next.js web app that walks New Zealand homeowners through a Warmer Kiwi Homes eligibility check:

1. NZ address autocomplete (AddressRight)
2. Owner-occupier vs rental
3. Built before 2008?
4. Community Services Card?
5. Behind the scenes: EECA existing-claim check + NZDep2023 funding zone
6. Results emailed to `insulator.dan@gmail.com` and saved to local SQLite

## Funding rules (as configured)

| Situation | Funding |
| --- | --- |
| Community Services Card | **90%** (regardless of NZDep) |
| NZDep decile 5–7 | **50%** |
| NZDep decile 8 | **80%** |
| NZDep decile 9–10 | **90%** |
| NZDep 1–4 without CSC | Not eligible |
| Rental / built 2008+ | Not eligible |

## Stack (free / sandbox)

- **Next.js 16** + TypeScript + Tailwind (Vercel-ready)
- **AddressRight** autocomplete (same service EECA uses)
- **Playwright** bot for EECA `/api/tools/wkh/qualify` (reCAPTCHA token from their public page)
- **ArcGIS FeatureServer** for NZDep2023 SA1 decile (Massey / EHINZ map data)
- **SQLite** (`data/submissions.db`) for submissions
- **Email**: Resend or SMTP if configured; otherwise writes to `data/outbox/`

## Quick start

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional email (recommended for real sends)

```bash
# Free Resend tier: https://resend.com
export RESEND_API_KEY=re_xxx
export RESEND_FROM="WKH Checker <onboarding@resend.dev>"
export NOTIFY_EMAIL=insulator.dan@gmail.com
```

Or SMTP:

```bash
export SMTP_HOST=...
export SMTP_PORT=587
export SMTP_USER=...
export SMTP_PASS=...
export SMTP_FROM=...
```

Without either, submissions still save to SQLite and a JSON email draft is written under `data/outbox/`.

## API routes

- `GET /api/address?q=` — address suggestions
- `POST /api/check` — full eligibility evaluation
- `POST /api/submit` — persist + notify

## Notes

- The EECA check needs a server that can run Playwright (local Node / long-running host). Vercel serverless is fine for the UI and NZDep lookup, but the EECA bot is best kept on a small always-on Node process when you deploy.
- For production AddressRight usage, register your own API key and set `ADDRESS_RIGHT_API_KEY`.
- This Tool is not affiliated with EECA; final grant decisions rest with EECA and approved providers.
