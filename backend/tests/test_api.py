"""Integration tests for FastAPI endpoints."""

from datetime import date
import pytest
from starlette.testclient import TestClient

from src.api.main import app


@pytest.fixture(scope="module")
def client():
    """Provides a TestClient for FastAPI endpoints."""
    return TestClient(app)


def test_health_check_endpoint(client: TestClient):
    """Verifies /health reports healthy status and model readiness."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_ready"] is True
    assert data["records_count"] > 0
    assert "timestamp" in data


def test_root_endpoint(client: TestClient):
    """Verifies root endpoint returns welcoming docs info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "docs" in data


def test_forecast_endpoint_success(client: TestClient):
    """Verifies POST /api/forecast generates portion recommendations."""
    payload = {
        "meal_date": "2026-10-21",
        "meal_type": "lunch",
        "expected_attendance": 185,
        "safety_buffer_pct": 0.10,
        "dishes": [
            {"dish_id": "d_rice_lunch", "dish_name": "Steamed Basmati Rice"},
            {"dish_id": "d_dal_tadka", "dish_name": "Yellow Dal Tadka"},
        ],
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["meal_type"] == "lunch"
    assert data["expected_attendance"] == 185
    assert data["safety_buffer_pct"] == 0.10
    assert len(data["recommendations"]) == 2
    assert data["total_recommended_portions"] > 0

    first_rec = data["recommendations"][0]
    assert first_rec["dish_id"] == "d_rice_lunch"
    assert first_rec["recommended_portions"] >= first_rec["predicted_portions"]
    assert len(first_rec["explanation_factors"]) > 0


def test_forecast_endpoint_empty_dishes(client: TestClient):
    """Verifies POST /api/forecast rejects requests with no dishes."""
    payload = {
        "meal_date": "2026-10-21",
        "meal_type": "lunch",
        "expected_attendance": 180,
        "dishes": [],
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code in [400, 422]


def test_metrics_endpoint(client: TestClient):
    """Verifies GET /api/metrics exposes benchmark comparison with synthetic tag."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()

    assert "random_forest" in data
    assert "baseline" in data
    assert data["is_synthetic"] is True
    assert "disclaimer" in data
    assert data["random_forest"]["mae"] > 0


def test_dishes_catalog_endpoint(client: TestClient):
    """Verifies GET /api/dishes returns standard mess dishes."""
    response = client.get("/api/dishes")
    assert response.status_code == 200
    dishes = response.json()
    assert len(dishes) >= 9
    assert any(d["id"] == "d_idli" for d in dishes)
    assert any(d["id"] == "d_rice_lunch" for d in dishes)


def test_records_list_and_create_endpoints(client: TestClient):
    """Verifies listing and creating meal records."""
    # List records
    get_res = client.get("/api/records?limit=10")
    assert get_res.status_code == 200
    records = get_res.json()
    assert len(records) <= 10

    # Create new record
    new_record_payload = {
        "dish_id": "d_idli",
        "dish_name": "Idli & Sambar",
        "meal_date": "2026-10-18",
        "meal_type": "breakfast",
        "attendance": 170,
        "prepared_portions": 160,
        "served_portions": 155,
        "leftover_portions": 5,
    }
    post_res = client.post("/api/records", json=new_record_payload)
    assert post_res.status_code == 201
    created_rec = post_res.json()
    assert created_rec["dish_id"] == "d_idli"
    assert created_rec["is_synthetic"] is False


def test_reset_synthetic_endpoint(client: TestClient):
    """Verifies POST /api/records/reset-synthetic reseeds dataset."""
    response = client.post("/api/records/reset-synthetic")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["records_count"] > 0
