"""Forecast service orchestrator managing meal records, model training, and recommendation generation."""

from datetime import date, datetime, timezone
from typing import List, Optional, Dict
import uuid

from src.schemas.dish import Dish
from src.schemas.meal_record import MealRecord, MealRecordCreate
from src.schemas.forecast import ForecastRequest, ForecastResponse, DishForecastRecommendation
from src.data.synthetic import generate_synthetic_records, get_standard_dishes
from src.data.preprocessor import FeaturePreprocessor
from src.models.baseline import HistoricalAverageBaseline
from src.models.random_forest import DemandRandomForestModel
from src.services.recommendation import build_dish_recommendation
from src.config import MIN_DATA_THRESHOLD, DEFAULT_SAFETY_BUFFER


class ForecastService:
    """Singleton service managing in-memory meal state and model orchestration."""

    _instance: Optional["ForecastService"] = None

    def __init__(self):
        self.dishes: Dict[str, Dish] = {d.id: d for d in get_standard_dishes()}
        self.records: List[MealRecord] = []
        self.baseline_model = HistoricalAverageBaseline(min_threshold=MIN_DATA_THRESHOLD)
        self.rf_model = DemandRandomForestModel()
        self.is_trained: bool = False
        self.reset_to_synthetic_data()

    @classmethod
    def get_instance(cls) -> "ForecastService":
        """Returns the singleton instance of ForecastService."""
        if cls._instance is None:
            cls._instance = ForecastService()
        return cls._instance

    def reset_to_synthetic_data(self) -> int:
        """Seeds the service with 60-day synthetic hostel meal data and trains models."""
        self.records = generate_synthetic_records()
        self._retrain_models()
        return len(self.records)

    def _retrain_models(self) -> None:
        """Fits both HistoricalAverageBaseline and DemandRandomForestModel on current records."""
        # 1. Fit baseline model
        self.baseline_model.fit(self.records)

        # 2. Extract features and fit Random Forest
        X, y = FeaturePreprocessor.prepare_training_dataset(self.records)
        if not X.empty and not y.empty:
            self.rf_model.fit(X, y)
            self.is_trained = True

    def get_dishes(self) -> List[Dish]:
        """Returns the catalog of registered dishes."""
        return list(self.dishes.values())

    def get_records(
        self,
        dish_id: Optional[str] = None,
        meal_type: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100,
    ) -> List[MealRecord]:
        """Filters historical meal records."""
        results = self.records

        if dish_id:
            results = [r for r in results if r.dish_id == dish_id]
        if meal_type:
            results = [r for r in results if r.meal_type.lower() == meal_type.lower()]
        if start_date:
            results = [r for r in results if r.meal_date >= start_date]
        if end_date:
            results = [r for r in results if r.meal_date <= end_date]

        # Return latest records first
        sorted_results = sorted(results, key=lambda r: (r.meal_date, r.meal_type), reverse=True)
        return sorted_results[:limit]

    def add_record(self, record_in: MealRecordCreate) -> MealRecord:
        """Adds a new historical meal record and updates model state."""
        record_id = f"rec_{date.today().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
        derived_day = record_in.meal_date.weekday() if record_in.day_of_week is None else record_in.day_of_week

        new_record = MealRecord(
            id=record_id,
            dish_id=record_in.dish_id,
            dish_name=record_in.dish_name or self.dishes.get(record_in.dish_id, Dish(id=record_in.dish_id, name=record_in.dish_id, meal_type="lunch", category="main")).name,
            meal_date=record_in.meal_date,
            meal_type=record_in.meal_type,
            day_of_week=derived_day,
            attendance=record_in.attendance,
            prepared_portions=record_in.prepared_portions,
            served_portions=record_in.served_portions,
            leftover_portions=record_in.leftover_portions,
            is_synthetic=False,
        )

        self.records.append(new_record)
        # Update baseline model immediately
        self.baseline_model.fit(self.records)
        return new_record

    def generate_forecast(self, request: ForecastRequest) -> ForecastResponse:
        """Generates next-day preparation recommendations for all requested dishes."""
        target_date = request.meal_date
        target_meal_type = request.meal_type.lower()
        attendance = request.expected_attendance
        buffer_pct = request.safety_buffer_pct if request.safety_buffer_pct is not None else DEFAULT_SAFETY_BUFFER

        recommendations: List[DishForecastRecommendation] = []

        for item in request.dishes:
            dish_id = item.dish_id
            dish_name = item.dish_name or (self.dishes[dish_id].name if dish_id in self.dishes else dish_id)

            # Count historical observations with valid effective demand
            history = [
                r for r in self.records
                if r.dish_id == dish_id and FeaturePreprocessor.extract_effective_demand(r) is not None
            ]
            data_points_count = len(history)

            # Decision branch: ML model vs Fallback baseline
            if self.is_trained and data_points_count >= MIN_DATA_THRESHOLD:
                # Prepare single-row feature vector
                X_infer = FeaturePreprocessor.prepare_inference_features(
                    dish_id=dish_id,
                    meal_type=target_meal_type,
                    meal_date=target_date,
                    expected_attendance=attendance,
                    historical_records=self.records,
                )
                pred_portions, explanations = self.rf_model.predict_with_explanation(
                    X_infer, dish_name=dish_name
                )
                model_used = "random_forest"
                is_fallback = False
            else:
                # Use HistoricalAverageBaseline transparent fallback
                base_pred = self.baseline_model.predict_dish(
                    dish_id=dish_id,
                    day_of_week=target_date.weekday(),
                    expected_attendance=attendance,
                    meal_type=target_meal_type,
                )
                pred_portions = base_pred.predicted_portions
                explanations = [base_pred.explanation]
                model_used = "baseline_fallback"
                is_fallback = True

            recommendation = build_dish_recommendation(
                dish_id=dish_id,
                dish_name=dish_name,
                meal_type=target_meal_type,
                predicted_portions=pred_portions,
                safety_buffer_pct=buffer_pct,
                model_used=model_used,
                data_points_count=data_points_count,
                is_fallback=is_fallback,
                base_explanations=explanations,
            )
            recommendations.append(recommendation)

        total_portions = sum(r.recommended_portions for r in recommendations)

        return ForecastResponse(
            meal_date=target_date,
            meal_type=target_meal_type,
            expected_attendance=attendance,
            safety_buffer_pct=buffer_pct,
            recommendations=recommendations,
            total_recommended_portions=total_portions,
            generated_at=datetime.now(timezone.utc),
        )
