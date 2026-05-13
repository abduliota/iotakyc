from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

from db import get_db, db_available

router = APIRouter()

# ── Fallback in-memory store (used when Supabase is not configured) ───────────
_sessions: dict[str, dict] = {}
_kyc_data: dict[str, dict] = {}

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

class CreateSessionRequest(BaseModel):
    iqama: str
    user_id: Optional[str] = None

# ── Helpers ────────────────────────────────────────────────────────────────────

def _use_supabase() -> bool:
    return db_available()

def _create_session_db(session_id: str, iqama: str, user_id: str, now: str) -> dict:
    db = get_db()

    # Upsert into kyc_sessions
    db.table("kyc_sessions").insert({
        "id": session_id,
        "user_id": None,
        "iqama": iqama,           # store iqama on session for easy lookup
        "current_step": 1,
        "status": "in_progress",
        "started_at": now,
        "updated_at": now,
    }).execute()

    # Create empty kyc_data row
    db.table("kyc_data").insert({
        "session_id": session_id,
        "iqama": iqama,
        "updated_at": now,
    }).execute()

    return {
        "id": session_id,
        "user_id": user_id,
        "iqama": iqama,
        "current_step": 1,
        "status": "in_progress",
        "started_at": now,
        "updated_at": now,
    }

def _get_session_db(session_id: str) -> Optional[dict]:
    db = get_db()
    res = db.table("kyc_sessions").select("*").eq("id", session_id).single().execute()
    return res.data if res.data else None

def _save_step_db(session_id: str, step: int, body: dict) -> dict:
    db = get_db()
    now = _now()

    # Filter out None and empty string values
    clean = {k: v for k, v in body.items() if v is not None and v != ""}
    clean["updated_at"] = now

    # Upsert into kyc_data
    db.table("kyc_data").upsert({
        "session_id": session_id,
        **clean,
    }).execute()

    # Update current_step in session
    session_res = db.table("kyc_sessions").select("current_step").eq("id", session_id).single().execute()
    current = session_res.data.get("current_step", 1) if session_res.data else 1
    new_step = max(current, step + 1)

    db.table("kyc_sessions").update({
        "current_step": new_step,
        "updated_at": now,
    }).eq("id", session_id).execute()

    return {"id": session_id, "current_step": new_step, "updated_at": now}

def _get_kyc_data_db(session_id: str) -> Optional[dict]:
    db = get_db()
    res = db.table("kyc_data").select("*").eq("session_id", session_id).single().execute()
    return res.data if res.data else None

def _submit_db(session_id: str, elm_result: bool, elm_code: str) -> dict:
    db = get_db()
    now = _now()

    # Update kyc_data with ELM result
    db.table("kyc_data").update({
        "elm_result": elm_result,
        "elm_result_code": elm_code,
        "elm_checked_at": now,
        "updated_at": now,
    }).eq("session_id", session_id).execute()

    # Update session status
    db.table("kyc_sessions").update({
        "status": "submitted",
        "submitted_at": now,
        "updated_at": now,
    }).eq("id", session_id).execute()

    return {"status": "submitted", "submitted_at": now}

# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/session")
def create_session(body: CreateSessionRequest):
    """Create a new KYC session."""
    session_id = str(uuid.uuid4())
    now = _now()
    user_id = body.user_id or f"user-{body.iqama}"

    if _use_supabase():
        try:
            return _create_session_db(session_id, body.iqama, user_id, now)
        except Exception as e:
            print(f"[Supabase] create_session failed: {e} — falling back to memory")

    # Memory fallback
    session = {
        "id": session_id,
        "user_id": user_id,
        "iqama": body.iqama,
        "current_step": 1,
        "status": "in_progress",
        "started_at": now,
        "updated_at": now,
    }
    _sessions[session_id] = session
    _kyc_data[session_id] = {"session_id": session_id, "iqama": body.iqama}
    return session


@router.get("/session/{session_id}")
def get_session(session_id: str):
    """Get current session state."""
    if _use_supabase():
        try:
            data = _get_session_db(session_id)
            if data:
                return data
        except Exception as e:
            print(f"[Supabase] get_session failed: {e} — falling back to memory")

    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.patch("/session/{session_id}/step/{step}")
async def save_step(session_id: str, step: int, request: Request):
    """Save step data and advance the session."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    # Unwrap "data" key if present
    if isinstance(body, dict) and "data" in body and isinstance(body["data"], dict):
        body = body["data"]

    if _use_supabase():
        try:
            # Verify session exists
            sess = _get_session_db(session_id)
            if not sess:
                raise HTTPException(status_code=404, detail="Session not found")
            return _save_step_db(session_id, step, body)
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Supabase] save_step {step} failed: {e} — falling back to memory")

    # Memory fallback
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_id not in _kyc_data:
        _kyc_data[session_id] = {"session_id": session_id}
    _kyc_data[session_id].update({k: v for k, v in body.items() if v is not None and v != ""})
    session["current_step"] = max(session.get("current_step", 1), step + 1)
    session["updated_at"] = _now()
    return session


@router.get("/session/{session_id}/data")
def get_kyc_data(session_id: str):
    """Get all collected KYC data for this session."""
    if _use_supabase():
        try:
            data = _get_kyc_data_db(session_id)
            if data:
                return data
        except Exception as e:
            print(f"[Supabase] get_kyc_data failed: {e} — falling back to memory")

    data = _kyc_data.get(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="No data found for session")
    return data


@router.post("/session/{session_id}/submit")
async def submit_kyc(session_id: str):
    """Final submission — runs ELMNatheer watchlist check server-side."""

    # Get the KYC data (from Supabase or memory)
    kyc: dict = {}
    if _use_supabase():
        try:
            kyc = _get_kyc_data_db(session_id) or {}
        except Exception as e:
            print(f"[Supabase] get_kyc_data on submit failed: {e}")
            kyc = _kyc_data.get(session_id, {})
    else:
        kyc = _kyc_data.get(session_id, {})

    # Get iqama from kyc_data or session
    iqama = kyc.get("iqama", "")
    if not iqama and _use_supabase():
        try:
            sess = _get_session_db(session_id)
            iqama = (sess or {}).get("iqama", "")
        except Exception:
            pass
    if not iqama:
        iqama = (_sessions.get(session_id) or {}).get("iqama", "")

    # Run ELMNatheer watchlist check
    from services.elm import check_watchlist
    elm = await check_watchlist(
        person_id=iqama,
        id_type="NIN",
        dob=kyc.get("date_of_birth", ""),
    )

    elm_result = elm["result"]
    elm_code = elm["result_code"]
    now = _now()

    if _use_supabase():
        try:
            _submit_db(session_id, elm_result, elm_code)
        except Exception as e:
            print(f"[Supabase] submit failed: {e} — falling back to memory")
            _fallback_submit(session_id, elm_result, elm_code, now)
    else:
        _fallback_submit(session_id, elm_result, elm_code, now)

    return {
        "success": True,
        "session_id": session_id,
        "status": "submitted",
        "watchlist_flagged": not elm_result,
        "elm_result_code": elm_code,
    }


def _fallback_submit(session_id: str, elm_result: bool, elm_code: str, now: str):
    if session_id in _kyc_data:
        _kyc_data[session_id]["elm_result"] = elm_result
        _kyc_data[session_id]["elm_result_code"] = elm_code
        _kyc_data[session_id]["elm_checked_at"] = now
    if session_id in _sessions:
        _sessions[session_id]["status"] = "submitted"
        _sessions[session_id]["submitted_at"] = now
        _sessions[session_id]["updated_at"] = now