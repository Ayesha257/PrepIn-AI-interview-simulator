from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os
import random
from dotenv import load_dotenv
load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
)

def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))  # 6-digit code

async def send_verification_code_email(email: str, code: str):
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1B1931; border-radius: 16px;">
        <h1 style="color: #ED9E59; text-align: center; margin-bottom: 4px;">PrepIn</h1>
        <p style="color: #E98CB9; text-align: center; margin-top: 0;">AI Interview Simulator</p>
        <h2 style="color: #ffffff; text-align: center;">Verify your email</h2>
        <p style="color: #cccccc; text-align: center; line-height: 1.5;">
            Enter this code on the PrepIn website to verify your account:
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <span style="background: #ED9E59; color: #1B1931; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 28px; letter-spacing: 6px; display: inline-block;">
                {code}
            </span>
        </div>
        <p style="color: #888888; font-size: 12px; text-align: center;">
            This code will expire in 10 minutes. If you didn't create a PrepIn account, you can ignore this email.
        </p>
    </div>
    """

    message = MessageSchema(
        subject="Your PrepIn verification code",
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_reset_password_code_email(email: str, code: str):
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1B1931; border-radius: 16px;">
        <h1 style="color: #ED9E59; text-align: center; margin-bottom: 4px;">PrepIn</h1>
        <p style="color: #E98CB9; text-align: center; margin-top: 0;">AI Interview Simulator</p>
        <h2 style="color: #ffffff; text-align: center;">Reset your password</h2>
        <p style="color: #cccccc; text-align: center; line-height: 1.5;">
            Enter this code on the PrepIn website to reset your password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <span style="background: #ED9E59; color: #1B1931; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 28px; letter-spacing: 6px; display: inline-block;">
                {code}
            </span>
        </div>
        <p style="color: #888888; font-size: 12px; text-align: center;">
            This code will expire in 10 minutes. If you didn't request this, ignore this email.
        </p>
    </div>
    """

    message = MessageSchema(
        subject="Your PrepIn password reset code",
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)