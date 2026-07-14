import os
import random
import requests
from dotenv import load_dotenv
load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
MAIL_FROM = os.getenv("MAIL_FROM")

def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))  # 6-digit code

def _send_email(to_email: str, subject: str, html_body: str):
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }
    payload = {
        "sender": {"name": "PrepIn", "email": MAIL_FROM},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }
    response = requests.post(BREVO_API_URL, json=payload, headers=headers)
    if response.status_code >= 300:
        raise Exception(f"Brevo API error: {response.status_code} - {response.text}")
    return response.json()


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
    _send_email(email, "Your PrepIn verification code", html_body)


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
    _send_email(email, "Your PrepIn password reset code", html_body)