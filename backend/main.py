from fastapi import FastAPI
from routes import interview, report

app = FastAPI()

app.include_router(interview.router, prefix="/interview")

app.include_router(report.router, prefix="/report")

@app.get("/")
def home():
    return {"message" : "this is a test route"}