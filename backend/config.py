from dotenv import load_dotenv
import os

load_dotenv()


class Settings:

    MONGO_URL = os.getenv("MONGO_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = "HS256"


settings = Settings()