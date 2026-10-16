"""FastAPI entrypoint for MealRelay backend."""

from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes.forecast import router as forecast_router
from src.api.routes.records import router as records_router
from src.services.forecast_service import ForecastService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes model training and synthetic records on startup."""
    service = ForecastService.get_instance()
    # Ensure models are trained
    if not service.is_trained:
        service.reset_to_synthetic_data()
    yield


app = FastAPI(
    title="MealRelay API",
    description="Hostel Mess Demand Forecasting and Portions Recommendation API",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(forecast_router, prefix="/api", tags=["Forecast & Recommendations"])
app.include_router(records_router, prefix="/api", tags=["Meal Records & Dishes"])


@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Health check and ML model readiness",
)
def health_check() -> Dict[str, Any]:
    """Returns service health, model status, and record count."""
    service = ForecastService.get_instance()
    return {
        "status": "healthy",
        "service": "MealRelay Backend",
        "version": "0.1.0",
        "models_ready": service.is_trained,
        "records_count": len(service.records),
        "dishes_count": len(service.dishes),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", status_code=status.HTTP_200_OK, include_in_schema=False)
def root() -> Dict[str, str]:
    """Root redirect / friendly greeting pointing to docs."""
    return {
        "message": "Welcome to MealRelay API. Visit /docs for OpenAPI documentation.",
        "health": "/health",
        "docs": "/docs",
    }
