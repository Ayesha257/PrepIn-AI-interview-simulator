# PrepIn

AI-powered interview simulator that generates resume-based interview questions, evaluates responses in real time, and tracks performance across sessions.

## Features

- Resume-based interview question generation
- Voice-based responses with text-to-speech playback
- Automated response evaluation with scoring
- Analytics dashboard with performance trends
- Secure authentication (JWT, email verification, password reset)

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **AI Engine:** LLM-powered interview and evaluation agents

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

## How to Run

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
MONGO_URI=
JWT_SECRET=
LLM_API_KEY=
EMAIL_USER=
EMAIL_PASSWORD=
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Made By
```
Ayesha Amer
Faiqa Wasseem
```
