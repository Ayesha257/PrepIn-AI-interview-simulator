from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from jose import jwt
from datetime import datetime, timedelta
import os

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
)

JWT_SECRET = os.getenv("JWT_SECRET")

def create_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({"sub": email, "exp": expire}, JWT_SECRET, algorithm="HS256")

async def send_verification_email(email: str):
    token = create_verification_token(email)
    link = f"{os.getenv('FRONTEND_URL')}/verify-email?token={token}"

    message = MessageSchema(
        subject="Verify your PrepIn account",
        recipients=[email],
        body=f"Click to verify your email: {link}",
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)