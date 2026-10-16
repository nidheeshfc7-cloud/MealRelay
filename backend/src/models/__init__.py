"""Forecasting models package."""

from src.models.baseline import HistoricalAverageBaseline, BaselinePrediction

__all__ = [
    "HistoricalAverageBaseline",
    "BaselinePrediction",
]
