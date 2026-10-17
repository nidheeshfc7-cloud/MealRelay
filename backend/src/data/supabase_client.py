"""Direct Supabase PostgreSQL storage adapter for MealRelay.

Provides production persistence via Supabase PostgREST while enabling
seamless, zero-dependency in-memory edge operation when offline or credentials
are omitted. Completely eliminates intermediate SQLite complexity.
"""

import os
import logging
from typing import List, Optional, Dict, Any
import httpx

from src.schemas.meal_record import MealRecord

logger = logging.getLogger("mealrelay.supabase")


class SupabaseStorageAdapter:
    """Production storage adapter connecting directly to Supabase PostgreSQL."""

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
    ):
        self.url = (supabase_url or os.getenv("SUPABASE_URL", "")).rstrip("/")
        self.key = supabase_key or os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.table_name = "meal_records"
        self._is_configured = bool(self.url and self.key)

    def is_configured(self) -> bool:
        """Returns True if valid Supabase connection credentials exist."""
        return self._is_configured

    @property
    def mode(self) -> str:
        """Returns active storage mode."""
        return "supabase_cloud" if self._is_configured else "in_memory_edge"

    def _get_headers(self) -> Dict[str, str]:
        """Constructs authenticated Supabase PostgREST headers."""
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def sync_record(self, record: MealRecord) -> bool:
        """Persists a single meal record to Supabase PostgreSQL."""
        if not self._is_configured:
            return False

        endpoint = f"{self.url}/rest/v1/{self.table_name}"
        payload = {
            "id": record.id,
            "dish_id": record.dish_id,
            "dish_name": record.dish_name,
            "meal_date": record.meal_date.isoformat(),
            "meal_type": record.meal_type,
            "day_of_week": record.day_of_week,
            "attendance": record.attendance,
            "prepared_portions": record.prepared_portions,
            "served_portions": record.served_portions,
            "leftover_portions": record.leftover_portions,
            "category": record.category,
            "is_synthetic": record.is_synthetic,
        }

        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.post(endpoint, json=payload, headers=self._get_headers())
                return res.status_code in [200, 201]
        except Exception as e:
            logger.warning("Supabase sync failed (offline fallback active): %s", e)
            return False

    def sync_records_batch(self, records: List[MealRecord]) -> int:
        """Persists a batch of meal records to Supabase PostgreSQL."""
        if not self._is_configured or not records:
            return 0

        endpoint = f"{self.url}/rest/v1/{self.table_name}"
        payloads = [
            {
                "id": r.id,
                "dish_id": r.dish_id,
                "dish_name": r.dish_name,
                "meal_date": r.meal_date.isoformat(),
                "meal_type": r.meal_type,
                "day_of_week": r.day_of_week,
                "attendance": r.attendance,
                "prepared_portions": r.prepared_portions,
                "served_portions": r.served_portions,
                "leftover_portions": r.leftover_portions,
                "category": r.category,
                "is_synthetic": r.is_synthetic,
            }
            for r in records
        ]

        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.post(endpoint, json=payloads, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    return len(records)
                return 0
        except Exception as e:
            logger.warning("Supabase batch sync failed (offline fallback active): %s", e)
            return 0
