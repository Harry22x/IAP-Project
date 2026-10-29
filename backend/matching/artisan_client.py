import logging

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


def to_blood_group(blood_type, rhesus):
    if not blood_type or not rhesus:
        return None
    rh = {"positive": "+", "negative": "-"}.get(str(rhesus).lower())
    if not rh:
        return None
    return f"{blood_type}{rh}"


def fetch_artisan_donors():
    """ Returns [] if the producer is down."""
    base_url = getattr(settings, "ARTISAN_API_URL", "http://localhost:3000").rstrip("/")
    api_key = getattr(settings, "ARTISAN_API_KEY", None)
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{base_url}/api/artisans", headers=headers)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        logger.warning("Jua Kali artisan API unavailable: %s", exc)
        return []

    donors = []
    for artisan in payload.get("artisans") or []:
        blood_group = to_blood_group(artisan.get("blood_type"), artisan.get("rhesus_factor"))
        if not blood_group:
            continue
        donors.append(
            {
                "artisan_id": artisan.get("id"),
                "name": artisan.get("fullname"),
                "phone": artisan.get("phone"),
                "blood_group": blood_group,
                "source": "jua-kali",
            }
        )
    return donors
