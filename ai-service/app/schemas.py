"""Pydantic request / response schemas for the health‑risk prediction API."""

from pydantic import BaseModel, Field
from typing import Optional


class PredictionRequest(BaseModel):
    """Input features for a health‑risk prediction."""

    # Demographics
    age: int = Field(..., ge=1, le=120, description="Patient age in years")
    gender: str = Field(..., pattern="^(male|female)$", description="Gender: male or female")

    # Questionnaire
    bmi: float = Field(..., ge=10, le=60, description="Body mass index")
    smoker: bool = Field(False, description="Whether the user smokes")
    alcohol_frequency: str = Field(
        "never",
        pattern="^(never|occasional|regular)$",
        description="Alcohol consumption frequency",
    )
    exercise_frequency: str = Field(
        "moderate",
        pattern="^(sedentary|light|moderate|active)$",
        description="Exercise frequency category",
    )
    pre_existing_conditions_count: int = Field(0, ge=0, le=10)
    family_history_count: int = Field(0, ge=0, le=10)

    # Wearable metrics (daily averages)
    steps: int = Field(0, ge=0, le=50000)
    active_minutes: int = Field(0, ge=0, le=300)
    sleep_hours: float = Field(7.0, ge=0, le=24)
    resting_heart_rate: int = Field(70, ge=30, le=250)
    calories_burned: int = Field(0, ge=0, le=10000)
    distance_km: float = Field(0.0, ge=0, le=100)


class PredictionResponse(BaseModel):
    """Output of the health‑risk prediction."""

    ai_risk_score: int = Field(..., ge=0, le=100, description="Health risk score (0‑100, higher = healthier)")
    risk_category: str = Field(..., description="Risk bucket: low, moderate, or high")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence (0‑1)")


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class FeatureImportanceResponse(BaseModel):
    features: list[FeatureImportanceItem]


class HealthCheckResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str = "1.0.0"

