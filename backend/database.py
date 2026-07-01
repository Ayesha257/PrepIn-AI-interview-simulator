from pymongo import MongoClient
from dotenv import load_dotenv
import motor.motor_asyncio
import os

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# Faiqa's sync client (used in interview + report routes)
client = MongoClient(os.getenv("MONGO_URL"))
db = client["interview_simulator"]

# Ayesha's async client (used in auth + resume + analytics routes)
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = "interview_simulator"

async_client = None
async_db = None

async def connect_db():
    global async_client, async_db
    async_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    async_db = async_client[DB_NAME]

async def disconnect_db():
    global async_client
    if async_client:
        async_client.close()

def get_db():
    return async_db