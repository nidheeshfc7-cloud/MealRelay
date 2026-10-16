"""Data generation and feature engineering package."""

from src.data.synthetic import generate_synthetic_records, get_standard_dishes
from src.data.preprocessor import FeaturePreprocessor

__all__ = [
    "generate_synthetic_records",
    "get_standard_dishes",
    "FeaturePreprocessor",
]
