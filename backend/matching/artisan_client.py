import logging
import time

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

RETRY_STATUSES = {429, 500, 502, 503, 504}


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
    max_retries = 2
    delay_ms = 0.2
    response = None
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key

    for attempt in range(max_retries + 1):
        wait_time = delay_ms * (2 ** attempt)
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(f"{base_url}/api/artisans", headers=headers)

                if response.status_code not in RETRY_STATUSES or attempt >= max_retries:
                    break

                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    if retry_after and retry_after.isdigit():
                        wait_time = min(float(retry_after), 5.0)

                logger.warning(
                    "Attempt %d failed with status %d. retrying in %.2f seconds...",
                    attempt + 1,
                    response.status_code,
                    wait_time,
                )
                time.sleep(wait_time)

        except (httpx.TimeoutException, httpx.NetworkError, httpx.TransportError) as exc:
            if attempt >= max_retries:
                logger.warning("JuaKali API call failed permanently after %d attempts: %s", attempt + 1, exc)
                return []
            logger.warning(
                "Attempt %d failed due to network/timeout error (%s), retrying in %.2f seconds...",
                attempt + 1,
                exc,
                wait_time,
            )
            time.sleep(wait_time)

    try:
        if response is None or not response.is_success:
            return []
        payload = response.json()
    except Exception as exc:
        logger.warning("Failed to parse JSON response from Jua Kali artisan API: %s", exc)
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
