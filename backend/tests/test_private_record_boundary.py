"""Regression checks for separation of shared demo data and private activity."""
from types import SimpleNamespace
from unittest.mock import patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from src.api.routes.records import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)
record = {
    "dish_id": "test_dish",
    "meal_date": "2026-10-18",
    "meal_type": "lunch",
    "prepared_portions": 10,
    "served_portions": 8,
    "leftover_portions": 2,
    "attendance": 10,
}

@pytest.mark.parametrize("path,payload", [("/records", record), ("/records/batch", [record])])
def test_shared_writes_are_retired_before_touching_storage(path, payload):
    with patch("src.api.routes.records.ForecastService.get_instance") as service:
        response = client.post(path, json=payload)
    assert response.status_code == 410
    service.assert_not_called()

def test_shared_read_never_returns_private_rows():
    synthetic = SimpleNamespace(is_synthetic=True)
    private = SimpleNamespace(is_synthetic=False)
    with patch("src.api.routes.records.ForecastService.get_instance") as factory:
        factory.return_value.get_records.return_value = [synthetic, private]
        from src.api.routes.records import get_meal_records
        result = get_meal_records(dish_id=None, meal_type=None, start_date=None, end_date=None, limit=100)
    assert result == [synthetic]
