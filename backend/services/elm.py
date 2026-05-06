"""
ELMNatheer — Bulk Customer Watchlist API
Checks if a person appears on national watchlist/sanctions lists.
result: false = flagged (PEP flow triggered)
result: true  = clear
Mock mode when API key is not set.
"""
import os, httpx

ELM_API_KEY  = os.getenv("ELM_API_KEY", "")
ELM_BASE_URL = os.getenv("ELM_BASE_URL", "https://natheer.elm.sa")

async def check_watchlist(person_id: str, id_type: str, dob: str) -> dict:
    if not ELM_API_KEY:
        # Default mock = clear (not flagged)
        # To test PEP flow: set person_id to "TEST-PEP"
        flagged = person_id == "TEST-PEP"
        return {
            "person_id": person_id,
            "result": not flagged,
            "result_code": "YWCH-001" if flagged else "YWCH-000",
            "result_desc": "Inaccurate data entry identified" if flagged else "Clear",
            "source": "mock",
        }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{ELM_BASE_URL}/NatheerBulkCustAdd",
            json=[{
                "person": {
                    "personId": person_id,
                    "idType": id_type,
                    "dateOfBirth": dob,
                }
            }],
            headers={"Authorization": f"Bearer {ELM_API_KEY}"},
            timeout=15,
        )
        resp.raise_for_status()
        raw = resp.json()
        item = raw[0] if raw else {}
        return {
            "person_id": person_id,
            "result": item.get("result", True),
            "result_code": item.get("resultDetail", {}).get("resultCode", ""),
            "result_desc": item.get("resultDetail", {}).get("resultDesc", ""),
            "source": "live",
        }
