from fastapi import FastAPI
from routes import interview

app = FastAPI()

app.include_router(interview.router, prefix="/interview")

@app.get("/")
def home():
    return {"message" : "this is a test route"}