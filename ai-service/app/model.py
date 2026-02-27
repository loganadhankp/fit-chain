"""
Model loading and prediction logic.
Loads the trained XGBoost model, scaler, and label encoders on import,
and provides a `predict()` function for inference.
"""

import os
import json
import numpy as np
import joblib
from typing import Optional

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Lazy-loaded globals
_model = None
_scaler = None
_label_encoders = None
_feature_importance = None
_model_config = None


def _load_artifacts():
    """Load model, scaler, and encoders from disk (once)."""
    global _model, _scaler, _label_encoders, _feature_importance, _model_config

    _model = joblib.load(os.path.join(MODEL_DIR, "health_risk_model.joblib"))
    _scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
    _label_encoders = joblib.load(os.path.join(MODEL_DIR, "label_encoders.joblib"))

    with open(os.path.join(MODEL_DIR, "feature_importance.json")) as f:
        _feature_importance = json.load(f)

    with open(os.path.join(MODEL_DIR, "model_config.json")) as f:
        _model_config = json.load(f)


def ensure_loaded():
    """Ensure model artifacts are loaded."""
    if _model is None:
        _load_artifacts()


def is_loaded() -> bool:
    return _model is not None


def predict(
    age: int,
    gender: str,
    bmi: float,
    smoker: bool,
    alcohol_frequency: str,
    exercise_frequency: str,
    pre_existing_conditions_count: int,
    family_history_count: int,
    steps: int,
    active_minutes: int,
    sleep_hours: float,
    resting_heart_rate: int,
    calories_burned: int,
    distance_km: float,
) -> dict:
    """
    Run inference and return predicted health risk score.

    Returns dict with keys: ai_risk_score, risk_category, confidence
    """
    ensure_loaded()

    # Encode categoricals using the same encoders from training
    gender_enc = _encode("gender", gender)
    alcohol_enc = _encode("alcohol_frequency", alcohol_frequency)
    exercise_enc = _encode("exercise_frequency", exercise_frequency)

    # Build feature vector in the same order as training
    features = np.array(
        [
            [
                age,
                gender_enc,
                bmi,
                int(smoker),
                alcohol_enc,
                exercise_enc,
                pre_existing_conditions_count,
                family_history_count,
                steps,
                active_minutes,
                sleep_hours,
                resting_heart_rate,
                calories_burned,
                distance_km,
            ]
        ],
        dtype=float,
    )

    # Scale
    features_scaled = _scaler.transform(features)

    # Predict
    raw_score = float(_model.predict(features_scaled)[0])
    score = int(np.clip(round(raw_score), 0, 100))

    # Compute confidence: based on how far the prediction is from the
    # extremes and the ensemble's per-tree variance
    tree_preds = _get_tree_predictions(features_scaled)
    std = float(np.std(tree_preds)) if len(tree_preds) > 1 else 5.0
    # Map std → confidence: low variance = high confidence
    confidence = float(np.clip(1.0 - (std / 30.0), 0.5, 0.99))
    confidence = round(confidence, 4)

    # Categorize
    if score >= 75:
        category = "low"  # low risk
    elif score >= 50:
        category = "moderate"
    else:
        category = "high"  # high risk (low health score)

    return {
        "ai_risk_score": score,
        "risk_category": category,
        "confidence": confidence,
    }


def get_feature_importance() -> list[dict]:
    """Return feature importance sorted descending."""
    ensure_loaded()
    return [{"feature": k, "importance": round(v, 4)} for k, v in _feature_importance.items()]


# --------------- Helpers ---------------


def _encode(col: str, value: str) -> int:
    """Encode a categorical value using the trained LabelEncoder."""
    le = _label_encoders[col]
    if value in le.classes_:
        return int(le.transform([value])[0])
    # Fallback to most common class
    return 0


def _get_tree_predictions(features_scaled: np.ndarray) -> np.ndarray:
    """Get individual tree predictions for variance estimation."""
    try:
        booster = _model.get_booster()
        import xgboost as xgb

        dmat = xgb.DMatrix(features_scaled, feature_names=_model_config["feature_columns"])
        preds = booster.predict(dmat, output_margin=False, pred_leaf=False, iteration_range=(0, 0))
        # Use the final prediction and estimate per-tree variance from a subset
        n_trees = booster.num_boosted_rounds()
        tree_preds = []
        step = max(1, n_trees // 20)  # Sample ~20 checkpoints
        for i in range(step, n_trees + 1, step):
            p = booster.predict(dmat, iteration_range=(0, i))
            tree_preds.append(float(p[0]))
        return np.array(tree_preds)
    except Exception:
        return np.array([0.0])

