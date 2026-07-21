from pymongo import MongoClient
import motor.motor_asyncio
from config import settings

# Sync client (interview / orchestrator)
client = MongoClient(settings.MONGO_URL)
db = client[settings.DB_NAME]

# Async client (auth / resume / analytics / report)
async_client = None
async_db = None


async def connect_db():
    global async_client, async_db
    async_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URL)
    async_db = async_client[settings.DB_NAME]


async def disconnect_db():
    global async_client
    if async_client:
        async_client.close()


def get_db():
    return async_db
