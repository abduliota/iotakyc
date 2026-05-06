"""
TKML — Establishment Status API
Validates an employer's establishment status.
Mock mode when API key is not set.
"""
import os, httpx

TKML_API_KEY  = os.getenv("TKML_API_KEY", "")
TKML_BASE_URL = os.getenv("TKML_BASE_URL", "https://api.tkml.com.sa")

async def fetch_establishment(establishment_name: str) -> dict:
    if not TKML_API_KEY:
        # Return mock matching TKMLEstStatusInqRs_Host.json
        return {
            "success": True,
            "source": "mock",
            "establishment_name": establishment_name or "شركة تالين الطبية المحدودة",
            "establishment_status": "قائمة",  # Active
            "establishment_status_en": "Active",
        }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{TKML_BASE_URL}/EstStatusInq",
            params={"name": establishment_name},
            headers={"Authorization": f"Bearer {TKML_API_KEY}"},
            timeout=10,
        )
        resp.raise_for_status()
        raw = resp.json()
        return {
            "success": True,
            "source": "live",
            "establishment_name": raw.get("establishmentName", ""),
            "establishment_status": raw.get("establishmentStatus", ""),
            "establishment_status_en": "Active" if raw.get("establishmentStatus") == "قائمة" else "Inactive",
        }
