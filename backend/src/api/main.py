import asyncio
import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Dict, Any, List
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes.forecast import router as forecast_router
from src.api.routes.records import router as records_router
from src.services.forecast_service import ForecastService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes model training and synthetic records on startup."""
    service = ForecastService.get_instance()
    # Ensure models are trained without blocking the async event loop
    if not service.is_trained:
        await asyncio.to_thread(service.reset_to_synthetic_data)
    yield


app = FastAPI(
    title="MealRelay API",
    description="Hostel Mess Demand Forecasting and Portions Recommendation API",
    version="0.1.0",
    lifespan=lifespan,
)

# Parse configured CORS origins or default to standard local ports
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
_allowed_origins: List[str] = (
    [origin.strip() for origin in _cors_origins_env.split(",") if origin.strip()]
    if _cors_origins_env.strip()
    else [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
)

# Enable CORS with support for Vercel preview and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"^https:\/\/.*\.vercel\.app$"),
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
        "offline_edge_ready": True,
        "storage_mode": service.supabase_adapter.mode,
        "supabase_configured": service.supabase_adapter.is_configured(),
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
