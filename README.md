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
