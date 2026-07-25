# PrepIn

AI-powered interview simulator that generates resume-based interview questions, evaluates responses in real time, and tracks performance across sessions.

## Live Demo

- https://prep-in-ai-interview-simulator-hcgr.vercel.app

## Features

- Resume-based interview question generation
- Voice-based responses with text-to-speech playback
- Automated response evaluation with scoring
- Analytics dashboard with performance trends
- Secure authentication (JWT, email verification, password reset, Google Sign-In)

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** MongoDB Atlas
- **AI Engine:** LLM-powered interview and evaluation agents
- **Email:** Brevo (transactional email API)
- **Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```
PrepIn/
├── backend/
│   ├── agents/
│   ├── core/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── tools/
│   ├── utils/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── public/
    ├── src/
    ├── package.json
    └── tailwind.config.js
```

## How to Run Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # on Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  
```

`.env` file (inside `backend/`):
```
MONGO_URL=
JWT_SECRET=
GROQ_API_KEY=
GOOGLE_CLIENT_ID=
BREVO_API_KEY=
MAIL_FROM=
FRONTEND_URL=
```

### Frontend
```bash
cd frontend
npm install
npm start
```

`.env` file (inside `frontend/`):
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_GOOGLE_CLIENT_ID=
```

### Production env (important)

**Vercel (frontend)** — Environment Variable:
```
REACT_APP_API_BASE_URL=https://prepin-ai-interview-simulator.onrender.com/api
```
The value **must** end with `/api`. If you omit `/api`, login/register show **"Not Found"**.

**Render (backend)** — required variables match `backend/.env.example` (`MONGO_URL`, `SECRET_KEY`, etc.).
In MongoDB Atlas → Network Access, allow Render (or `0.0.0.0/0` for free tier).
Health check: `GET https://prepin-ai-interview-simulator.onrender.com/api/health`

### Locking Swagger (`/docs`)

By default `/docs`, `/redoc`, and `/openapi.json` return **404** (hidden from the public).

To allow only you and your partner, set on Render:

```
DOCS_USERNAME=your_shared_username
DOCS_PASSWORD=a_strong_shared_password
```

Then open `https://your-backend.onrender.com/docs` — the browser will ask for those credentials.

## Made By
```
Ayesha Amer
Faiqa Waseem
```
