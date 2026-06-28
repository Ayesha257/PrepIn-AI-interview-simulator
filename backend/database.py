import motor.motor_asyncio
from decouple import config

MONGO_URL = config("MONGO_URL")
DB_NAME = config("DB_NAME")

client = None
db = None

async def connect_db():
    global client, db
    print("MONGO_URL =", MONGO_URL)
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to {DB_NAME}")

async def disconnect_db():
    global client
    if client:
        client.close()

def get_db():
    return db