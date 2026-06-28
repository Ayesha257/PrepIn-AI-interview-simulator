from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.resume import router as resume_router
from routes.analytics import router as analytics_router
from database import connect_db, disconnect_db

app = FastAPI(
    title="PrepIn AI Interview Simulator",
    description="Backend API for PrepIn — AI-powered interview prep",
    version="1.0.0"
)

# CORS — allow React frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(resume_router, prefix="/api/resume", tags=["Resume"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

@app.get("/")
async def root():
    return {"message": "PrepIn API is running 🚀", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}