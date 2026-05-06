from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random, string

router = APIRouter()

# In-memory OTP store — replace with Redis in production
_otp_store: dict[str, str] = {}

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    iqama: str

@router.post("/otp/send")
def send_otp(body: OTPRequest):
    """Send OTP to customer's mobile number."""
    otp = ''.join(random.choices(string.digits, k=6))
    _otp_store[body.phone] = otp
    # TODO: integrate with SMS gateway (Unifonic / Msegat)
    print(f"[DEV] OTP for {body.phone}: {otp}")
    return {"success": True, "message": "OTP sent"}

@router.post("/otp/verify")
def verify_otp(body: OTPVerify):
    """Verify OTP and return session token."""
    stored = _otp_store.get(body.phone)
    if not stored or stored != body.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    del _otp_store[body.phone]
    # TODO: create/fetch user in Supabase, return JWT
    return {
        "success": True,
        "user_id": f"user-{body.iqama}",
        "token": "dev-token",  # replace with real JWT
    }
