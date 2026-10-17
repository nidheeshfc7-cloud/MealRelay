import os
from pathlib import Path
from typing import List

# Enforce single-threaded math libraries to prevent memory exhaustion on Windows/edge devices
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

# Base Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent / "data"

# Recommendation & Forecast Defaults
DEFAULT_SAFETY_BUFFER: float = 0.10  # 10% safety buffer
MIN_DATA_THRESHOLD: int = 5          # Minimum historical records to train ML model instead of baseline fallback
SYNTHETIC_DAYS: int = 60            # 60 days of synthetic mess historical data
DEFAULT_HOSTEL_CAPACITY: int = 200   # Typical student count in target mess

# Model Configurations
RANDOM_STATE: int = 42
N_ESTIMATORS: int = 100

# Domain Constants
MEAL_TYPES: List[str] = ["breakfast", "lunch", "dinner"]
DAY_NAMES: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
