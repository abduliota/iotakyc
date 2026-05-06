from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.spost import fetch_national_address
from services.tkml import fetch_establishment
from services.elm import check_watchlist

router = APIRouter()

@router.get("/address/{iqama}")
async def get_national_address(iqama: str):
    """Fetch registered national address from SPOST API."""
    try:
        result = await fetch_national_address(iqama)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"SPOST API error: {str(e)}")

@router.get("/establishment/{name}")
async def get_establishment(name: str):
    """Validate establishment status via TKML API."""
    try:
        result = await fetch_establishment(name)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TKML API error: {str(e)}")

class WatchlistRequest(BaseModel):
    person_id: str
    id_type: str = "NIN"
    dob: str

@router.post("/watchlist")
async def watchlist_check(body: WatchlistRequest):
    """Check person against ELMNatheer watchlist."""
    try:
        result = await check_watchlist(body.person_id, body.id_type, body.dob)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ELM API error: {str(e)}")
