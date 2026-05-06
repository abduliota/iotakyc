from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from db import get_db, db_available

router = APIRouter()

# Memory fallback stores (shared with kyc.py via import)
from routers.kyc import _sessions, _kyc_data

class ActionRequest(BaseModel):
    action: str   # approved | rejected | flagged | requested_info
    notes: Optional[str] = None

_audit_log: list[dict] = []   # memory fallback for audit log

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _use_supabase() -> bool:
    return db_available()

# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/submissions")
def list_submissions(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List all submitted KYC applications."""

    if _use_supabase():
        try:
            return _list_from_supabase(status, page, limit)
        except Exception as e:
            print(f"[Supabase] list_submissions failed: {e} — falling back to memory")

    return _list_from_memory(status, page, limit)


def _list_from_supabase(status, page, limit) -> dict:
    db = get_db()

    # Query kyc_sessions joined with kyc_data
    query = db.table("kyc_sessions").select(
        "*, kyc_data(*)"
    ).neq("status", "in_progress")

    if status:
        query = query.eq("status", status)

    # Total count
    count_res = db.table("kyc_sessions").select("id", count="exact").neq("status", "in_progress")
    if status:
        count_res = count_res.eq("status", status)
    count_res = count_res.execute()
    total = count_res.count or 0

    # Paginated results
    offset = (page - 1) * limit
    res = query.order("updated_at", desc=True).range(offset, offset + limit - 1).execute()

    items = []
    for row in (res.data or []):
        kyc = row.get("kyc_data") or {}
        # Get audit logs for this session
        audit_res = db.table("audit_logs").select("*").eq("session_id", row["id"]).order("created_at").execute()
        audit = audit_res.data or []

        items.append({
            **row,
            "full_name":       kyc.get("full_name", "—"),
            "nationality":     kyc.get("nationality", "—"),
            "elm_result":      kyc.get("elm_result"),
            "elm_result_code": kyc.get("elm_result_code"),
            "kyc_data":        kyc,
            "audit":           audit,
        })

    return {"items": items, "total": total, "page": page}


def _list_from_memory(status, page, limit) -> dict:
    items = [s for s in _sessions.values() if s["status"] != "in_progress"]
    if status:
        items = [s for s in items if s["status"] == status]

    result = []
    for session in sorted(items, key=lambda x: x.get("updated_at", ""), reverse=True):
        sid = session["id"]
        kyc = _kyc_data.get(sid, {})
        audit = [log for log in _audit_log if log["session_id"] == sid]
        result.append({
            **session,
            "full_name":       kyc.get("full_name", "—"),
            "nationality":     kyc.get("nationality", "—"),
            "elm_result":      kyc.get("elm_result"),
            "elm_result_code": kyc.get("elm_result_code"),
            "kyc_data":        kyc,
            "audit":           audit,
        })

    total = len(result)
    start = (page - 1) * limit
    return {"items": result[start:start + limit], "total": total, "page": page}


@router.get("/submissions/{session_id}")
def get_submission(session_id: str):
    """Get full KYC profile for a specific submission."""

    if _use_supabase():
        try:
            db = get_db()
            session_res = db.table("kyc_sessions").select("*").eq("id", session_id).single().execute()
            if not session_res.data or session_res.data["status"] == "in_progress":
                raise HTTPException(status_code=404, detail="Submission not found")

            kyc_res = db.table("kyc_data").select("*").eq("session_id", session_id).single().execute()
            audit_res = db.table("audit_logs").select("*").eq("session_id", session_id).order("created_at").execute()

            return {
                "session":   session_res.data,
                "kyc_data":  kyc_res.data or {},
                "audit_log": audit_res.data or [],
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Supabase] get_submission failed: {e} — falling back to memory")

    # Memory fallback
    session = _sessions.get(session_id)
    if not session or session["status"] == "in_progress":
        raise HTTPException(status_code=404, detail="Submission not found")
    kyc = _kyc_data.get(session_id, {})
    audit = [log for log in _audit_log if log["session_id"] == session_id]
    return {"session": session, "kyc_data": kyc, "audit_log": audit}


@router.patch("/submissions/{session_id}")
def update_submission(session_id: str, body: ActionRequest):
    """Approve, reject, or flag a KYC submission."""
    valid_actions = ["approved", "rejected", "flagged", "requested_info"]
    if body.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Use: {valid_actions}")

    now = _now()

    if _use_supabase():
        try:
            db = get_db()
            # Get previous status for audit trail
            prev_res = db.table("kyc_sessions").select("status").eq("id", session_id).single().execute()
            prev_status = prev_res.data.get("status", "unknown") if prev_res.data else "unknown"

            # Update session status
            db.table("kyc_sessions").update({
                "status": body.action,
                "updated_at": now,
            }).eq("id", session_id).execute()

            # Insert audit log with previous status recorded
            db.table("audit_logs").insert({
                "session_id":    session_id,
                "agent_id":      None,
                "action":        body.action,
                "notes":         f"[Changed from: {prev_status}] {body.notes or ''}".strip(),
                "created_at":    now,
            }).execute()

            return {"success": True, "status": body.action, "previous_status": prev_status}
        except Exception as e:
            print(f"[Supabase] update_submission failed: {e} — falling back to memory")

    # Memory fallback
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    prev_status = session.get("status", "unknown")
    session["status"] = body.action
    session["updated_at"] = now
    _audit_log.append({
        "session_id": session_id,
        "agent_id":   "agent-dev",
        "action":     body.action,
        "notes":      f"[Changed from: {prev_status}] {body.notes or ''}".strip(),
        "created_at": now,
    })
    return {"success": True, "status": body.action, "previous_status": prev_status}


@router.get("/submissions/{session_id}/audit")
def get_audit_log(session_id: str):
    """Get audit trail for a submission."""
    if _use_supabase():
        try:
            db = get_db()
            res = db.table("audit_logs").select("*").eq("session_id", session_id).order("created_at").execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] get_audit_log failed: {e}")

    return [log for log in _audit_log if log["session_id"] == session_id]