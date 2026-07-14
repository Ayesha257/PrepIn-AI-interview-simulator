# PrepIn

AI-powered interview simulator that generates resume-based interview questions, evaluates responses in real time, and tracks performance across sessions.

## Live Demo

- **Frontend:** https://prep-in-ai-interview-simulator-hcgr.vercel.app

> Note: the backend is hosted on a free tier and may take 30-50 seconds to respond on the first request after inactivity.

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
REACT_APP_API_URL=https://prepin-ai-interview-simulator.onrender.com/api
```

## Made By
```
Ayesha Amer
Faiqa Waseem
```
