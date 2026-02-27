"""
HealthChain AI Service — FastAPI application.

Serves the trained XGBoost health‑risk model via a REST API.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    FeatureImportanceResponse,
    FeatureImportanceItem,
    HealthCheckResponse,
)
from app import model


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup."""
    print("[AI Service] Loading model artifacts...")
    model.ensure_loaded()
    print("[AI Service] Model ready.")
    yield


app = FastAPI(
    title="HealthChain AI Service",
    description="Health risk prediction powered by XGBoost trained on synthetic data.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the Node.js backend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────── Endpoints ───────────────────────


@app.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest):
    """
    Predict a health risk score (0‑100) for the given user features.

    - **ai_risk_score**: 0‑100 (higher = healthier)
    - **risk_category**: low / moderate / high risk
    - **confidence**: model confidence 0‑1
    """
    try:
        result = model.predict(
            age=req.age,
            gender=req.gender,
            bmi=req.bmi,
            smoker=req.smoker,
            alcohol_frequency=req.alcohol_frequency,
            exercise_frequency=req.exercise_frequency,
            pre_existing_conditions_count=req.pre_existing_conditions_count,
            family_history_count=req.family_history_count,
            steps=req.steps,
            active_minutes=req.active_minutes,
            sleep_hours=req.sleep_hours,
            resting_heart_rate=req.resting_heart_rate,
            calories_burned=req.calories_burned,
            distance_km=req.distance_km,
        )
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/feature-importance", response_model=FeatureImportanceResponse)
async def feature_importance():
    """Return ranked feature importances from the trained model."""
    items = model.get_feature_importance()
    return FeatureImportanceResponse(
        features=[FeatureImportanceItem(**item) for item in items]
    )


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health/readiness probe for Docker and monitoring."""
    return HealthCheckResponse(
        status="ok",
        model_loaded=model.is_loaded(),
    )

