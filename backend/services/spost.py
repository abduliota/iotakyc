"""
SPOST — Saudi Post National Address API
Wraps the SPOST API to fetch a registered national address by Iqama.
Mock mode when API key is not set.
"""
import os, httpx

SPOST_API_KEY  = os.getenv("SPOST_API_KEY", "")
SPOST_BASE_URL = os.getenv("SPOST_BASE_URL", "https://api.spost.com.sa")

async def fetch_national_address(iqama: str) -> dict:
    if not SPOST_API_KEY:
        # Return mock data matching SPOSTNtlAddrInqRs_Host.json structure
        return {
            "success": True,
            "source": "mock",
            "building_number": "8470",
            "street": "Ibrahim Al Baqai",
            "district": "Al Shifa Dist.",
            "city": "Riyadh",
            "postal_code": "12345",
            "additional_number": "3337",
            "unit_number": "8",
            "region": "Riyadh Region",
            "latitude": "24.7136",
            "longitude": "46.6753",
        }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SPOST_BASE_URL}/NtlAddrInq",
            json={
                "format": "JSON",
                "language": "",
                "api_key": SPOST_API_KEY,
                "iqama": iqama,
                "encode": "utf8"
            },
            timeout=10,
        )
        resp.raise_for_status()
        raw = resp.json()

        # Normalize SPOST response → our unified format
        addr = raw.get("Addresses", [{}])[0]
        return {
            "success": raw.get("success", False),
            "source": "live",
            "building_number": addr.get("BuildingNumber", ""),
            "street": addr.get("Street_L2", addr.get("Street", "")),
            "district": addr.get("District_L2", addr.get("District", "")),
            "city": addr.get("City_L2", addr.get("City", "")),
            "postal_code": addr.get("PostCode", ""),
            "additional_number": addr.get("AdditionalNumber", ""),
            "unit_number": addr.get("UnitNumber", ""),
            "region": addr.get("RegionName_L2", addr.get("RegionName", "")),
            "latitude": addr.get("Latitude", ""),
            "longitude": addr.get("Longitude", ""),
        }
