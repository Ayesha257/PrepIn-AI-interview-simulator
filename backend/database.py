from pymongo import MongoClient
import motor.motor_asyncio
from config import settings

# Sync client (interview / orchestrator)
client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=8000)
db = client[settings.DB_NAME]

# Async client (auth / resume / analytics / report)
async_client = None
async_db = None


async def connect_db():
    """Create async Mongo client and verify connectivity with a ping."""
    global async_client, async_db
    async_client = motor.motor_asyncio.AsyncIOMotorClient(
        settings.MONGO_URL,
        serverSelectionTimeoutMS=8000,
    )
    async_db = async_client[settings.DB_NAME]
    # Fail startup loudly if Atlas URL / network / credentials are wrong
    await async_client.admin.command("ping")


async def disconnect_db():
    global async_client, async_db
    if async_client:
        async_client.close()
    async_client = None
    async_db = None


def get_db():
    if async_db is None:
        raise RuntimeError(
            "Database is not connected. Check MONGO_URL on the server and that "
            "MongoDB Atlas allows connections (Network Access)."
        )
    return async_db
