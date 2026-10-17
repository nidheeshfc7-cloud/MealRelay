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

        # 2. Extract features and fit Random Forest with priority sample weights for real records
        X, y, weights = FeaturePreprocessor.prepare_training_dataset(self.records, return_weights=True)
        if not X.empty and not y.empty:
            self.rf_model.fit(X, y, sample_weight=weights)
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
        """Adds a new historical meal record and immediately retrains models."""
        record_id = f"rec_{date.today().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
        derived_day = record_in.meal_date.weekday() if record_in.day_of_week is None else record_in.day_of_week

        dish_obj = self.dishes.get(record_in.dish_id)
        category_val = (
            record_in.category
            or (dish_obj.category.value if dish_obj and hasattr(dish_obj.category, "value") else getattr(dish_obj, "category", "main"))
        )

        new_record = MealRecord(
            id=record_id,
            dish_id=record_in.dish_id,
            dish_name=record_in.dish_name or (dish_obj.name if dish_obj else record_in.dish_id),
            meal_date=record_in.meal_date,
            meal_type=record_in.meal_type,
            day_of_week=derived_day,
            attendance=record_in.attendance,
            prepared_portions=record_in.prepared_portions,
            served_portions=record_in.served_portions,
            leftover_portions=record_in.leftover_portions,
            category=category_val,
            is_synthetic=False,
        )

        self.records.append(new_record)
        # Immediately retrain models on updated dataset incorporating real user outcomes
        self._retrain_models()
        return new_record

    def add_records_batch(self, records_in: List[MealRecordCreate]) -> List[MealRecord]:
        """Adds multiple historical meal records and triggers retraining once for the batch."""
        created_records: List[MealRecord] = []
        for record_in in records_in:
            record_id = f"rec_{date.today().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
            derived_day = record_in.meal_date.weekday() if record_in.day_of_week is None else record_in.day_of_week
            dish_obj = self.dishes.get(record_in.dish_id)
            category_val = (
                record_in.category
                or (dish_obj.category.value if dish_obj and hasattr(dish_obj.category, "value") else getattr(dish_obj, "category", "main"))
            )

            new_record = MealRecord(
                id=record_id,
                dish_id=record_in.dish_id,
                dish_name=record_in.dish_name or (dish_obj.name if dish_obj else record_in.dish_id),
                meal_date=record_in.meal_date,
                meal_type=record_in.meal_type,
                day_of_week=derived_day,
                attendance=record_in.attendance,
                prepared_portions=record_in.prepared_portions,
                served_portions=record_in.served_portions,
                leftover_portions=record_in.leftover_portions,
                category=category_val,
                is_synthetic=False,
            )
            self.records.append(new_record)
            created_records.append(new_record)

        # Retrain once for the entire batch
        self._retrain_models()
        return created_records

    def generate_forecast(self, request: ForecastRequest) -> ForecastResponse:
        """Generates next-day preparation recommendations for all requested dishes."""
        target_date = request.meal_date
        target_meal_type = request.meal_type.lower()
        attendance = request.expected_attendance
        buffer_pct = request.safety_buffer_pct if request.safety_buffer_pct is not None else DEFAULT_SAFETY_BUFFER
        day_name = target_date.strftime("%A")
        is_weekend = target_date.weekday() in [5, 6]

        # Compute session menu context (rice pairing, competing curries)
        session_categories = []
        for itm in request.dishes:
            d_obj = self.dishes.get(itm.dish_id)
            c_val = (
                d_obj.category.value
                if d_obj and hasattr(d_obj.category, "value")
                else (d_obj.category if d_obj else "main")
            )
            session_categories.append((itm.dish_id, str(c_val).lower()))

        has_rice = int(any("rice" in c or "rice" in did for did, c in session_categories))
        competing_curries = int(sum(1 for _, c in session_categories if c in ["curry", "main"]))
        if competing_curries < 1:
            competing_curries = 1

        recommendations: List[DishForecastRecommendation] = []

        for item in request.dishes:
            dish_id = item.dish_id
            dish_obj = self.dishes.get(dish_id)
            dish_name = item.dish_name or (dish_obj.name if dish_obj else dish_id)
            category_val = (
                dish_obj.category.value
                if dish_obj and hasattr(dish_obj.category, "value")
                else (dish_obj.category if dish_obj else "Main")
            )

            # Count historical observations with valid effective demand
            history = [
                r for r in self.records
                if r.dish_id == dish_id and FeaturePreprocessor.extract_effective_demand(r) is not None
            ]
            data_points_count = len(history)

            # Decision branch: ML model vs Fallback baseline
            if self.is_trained and data_points_count >= MIN_DATA_THRESHOLD:
                # Prepare single-row feature vector with domain features
                X_infer = FeaturePreprocessor.prepare_inference_features(
                    dish_id=dish_id,
                    meal_type=target_meal_type,
                    meal_date=target_date,
                    expected_attendance=attendance,
                    historical_records=self.records,
                    category=category_val,
                    competing_curries_count=competing_curries,
                    is_paired_with_rice=has_rice,
                )
                pred_portions, adaptive_buffer, explanations = self.rf_model.predict_with_volatility_and_explanation(
                    X_infer, dish_name=dish_name
                )
                model_used = "random_forest"
                is_fallback = False
                # Use model's internal adaptive volatility buffer unless customer explicitly overrode it
                effective_buffer = buffer_pct if request.safety_buffer_pct is not None else adaptive_buffer
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
                effective_buffer = buffer_pct

            recommendation = build_dish_recommendation(
                dish_id=dish_id,
                dish_name=dish_name,
                meal_type=target_meal_type,
                predicted_portions=pred_portions,
                safety_buffer_pct=effective_buffer,
                model_used=model_used,
                data_points_count=data_points_count,
                is_fallback=is_fallback,
                base_explanations=explanations,
                category=category_val,
                attendance=attendance,
                day_name=day_name,
                is_weekend=is_weekend,
            )
            recommendations.append(recommendation)

        total_cook = sum(r.cook_portions for r in recommendations)

        return ForecastResponse(
            meal_date=target_date,
            meal_type=target_meal_type,
            expected_students=attendance,
            total_cook_portions=total_cook,
            dishes=recommendations,
            expected_attendance=attendance,
            safety_buffer_pct=buffer_pct,
            recommendations=recommendations,
            total_recommended_portions=total_cook,
            generated_at=datetime.now(timezone.utc),
        )
