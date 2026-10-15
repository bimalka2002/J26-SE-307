# J26-SE-307

SLIIT research project for AI-assisted oral disease analysis. The system accepts oral photographs and dental X-rays, runs specialist models (e.g. OLP, caries), and stores analysis results for general and clinical users.

## Project structure

```
J26-SE-307/
├── frontend/     # Next.js web app
├── backend/      # Express API + MongoDB
└── notebooks/    # Model training (Colab)
    ├── OLP.ipynb      # Oral Lichen Planus training
    └── Caries.ipynb   # Dental caries (AlphaDent / DENTEX)
```

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js (ESM), Express 5, MongoDB (Mongoose), JWT auth |
| ML | TensorFlow / Keras notebooks (Google Colab) |

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- npm

## Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/j26-se-307
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

Run the API:

```bash
npm run dev    # nodemon
# or
npm start      # node
```

Server defaults to `http://localhost:5000`.

### Auth API

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register (`general` or `clinical` role) |
| `POST` | `/auth/login` | Login, returns JWT |
| `GET` | `/auth/me` | Current user (Bearer token) |

User roles: `general`, `clinical`, `admin`.

The `Analysis` model is prepared for queued multi-model runs (oral photo / X-ray inputs, per-model scores, optional LLM report). Analysis routes are not wired yet.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Notebooks

Training notebooks live under `notebooks/` and are intended for Google Colab with datasets on Google Drive:

- **OLP.ipynb** — Oral Lichen Planus image-model training
- **Caries.ipynb** — Binary caries classification on intraoral / X-ray data (AlphaDent, DENTEX)

Open them in Colab from the GitHub repo, or upload locally.

## Development notes

- Keep secrets in `backend/.env` only; never commit them.
- Backend and frontend are separate packages — install and run each in its own folder.
- This is research software, not a clinical diagnostic device.

## OralScan authentication setup

The existing Next.js frontend now provides `/login`, `/register`, and a minimal protected `/app` landing page. The API exposes `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, and protected `GET /auth/me`. Password and Google sign-in both return the same OralScan bearer JWT session. The browser stores that JWT locally and checks it against `/auth/me` on refresh; sign out removes it. An unauthenticated visit to `/app` returns to `/login` with the intended route preserved.

Copy `backend/.env.example` to `backend/.env`, set a strong random `JWT_SECRET` and your MongoDB URI, then set `GOOGLE_CLIENT_ID` to your Google OAuth **Web application client ID**. Copy `frontend/.env.example` to `frontend/.env.local`; set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the API URL and the **same Web client ID**. These public client ID values are safe to include in browser code; never put a Google client secret in either frontend environment variable. This Google Identity Services ID-token flow does not use a Google client secret. `JWT_SECRET` is separate and signs OralScan's application session.

To configure Google sign-in, create an OAuth 2.0 client with application type **Web application** in Google Cloud Console, then add `http://localhost:3000` under **Authorized JavaScript origins**. Add your deployed site's origin there before deploying. The browser and backend must use the same client ID. Start MongoDB, then run `npm run dev` in `backend` and `npm run dev` in `frontend`. Use `npm test` in `backend` for the isolated authentication API tests.
