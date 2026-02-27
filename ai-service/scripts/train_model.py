"""
Health Risk Score Model Training Pipeline
Trains an XGBoost regressor on synthetic health data, evaluates performance,
and saves the model + scaler to the models/ directory.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_health_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Categorical columns that need encoding
CATEGORICAL_COLS = ["gender", "alcohol_frequency", "exercise_frequency"]

# Feature columns (order matters — must match prediction time)
FEATURE_COLS = [
    "age",
    "gender",
    "bmi",
    "smoker",
    "alcohol_frequency",
    "exercise_frequency",
    "pre_existing_conditions_count",
    "family_history_count",
    "steps",
    "active_minutes",
    "sleep_hours",
    "resting_heart_rate",
    "calories_burned",
    "distance_km",
]

TARGET_COL = "health_risk_score"


def load_and_prepare(path: str):
    """Load CSV and encode categoricals."""
    df = pd.read_csv(path)
    print(f"Loaded {len(df)} rows from {path}")

    # Encode categorical features
    label_encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
        print(f"  Encoded '{col}': {dict(zip(le.classes_, le.transform(le.classes_)))}")

    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    return X, y, label_encoders, FEATURE_COLS


def train(X, y):
    """Split, scale, train XGBoost, and evaluate."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(
        X_train_scaled,
        y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=50,
    )

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_pred = np.clip(y_pred, 0, 100)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("\n--- Evaluation ---")
    print(f"  MAE:     {mae:.2f}")
    print(f"  RMSE:    {rmse:.2f}")
    print(f"  R²:      {r2:.4f}")

    return model, scaler


def save_artifacts(model, scaler, label_encoders, feature_names):
    """Save model, scaler, encoders, and feature config."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, os.path.join(MODEL_DIR, "health_risk_model.joblib"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
    joblib.dump(label_encoders, os.path.join(MODEL_DIR, "label_encoders.joblib"))

    # Save feature importance
    importance = dict(zip(feature_names, model.feature_importances_.tolist()))
    importance_sorted = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))

    with open(os.path.join(MODEL_DIR, "feature_importance.json"), "w") as f:
        json.dump(importance_sorted, f, indent=2)

    # Save feature order config
    config = {
        "feature_columns": feature_names,
        "categorical_columns": CATEGORICAL_COLS,
        "target_column": TARGET_COL,
    }
    with open(os.path.join(MODEL_DIR, "model_config.json"), "w") as f:
        json.dump(config, f, indent=2)

    print(f"\nArtifacts saved to {MODEL_DIR}/")
    print("\nFeature importance (top 10):")
    for i, (feat, imp) in enumerate(importance_sorted.items()):
        if i >= 10:
            break
        print(f"  {i+1}. {feat}: {imp:.4f}")


def main():
    print("=" * 60)
    print("  HealthChain AI — Model Training Pipeline")
    print("=" * 60)

    X, y, label_encoders, feature_names = load_and_prepare(DATA_PATH)
    model, scaler = train(X, y)
    save_artifacts(model, scaler, label_encoders, feature_names)

    print("\nTraining complete!")


if __name__ == "__main__":
    main()

