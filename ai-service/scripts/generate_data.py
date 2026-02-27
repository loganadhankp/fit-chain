"""
Synthetic Health Data Generator
Generates 10,000+ realistic patient profiles with health features and a
computed health_risk_score (0-100, higher = healthier) for model training.
"""

import os
import numpy as np
import pandas as pd

SEED = 42
NUM_SAMPLES = 12_000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_health_data.csv")


def generate_data(n: int = NUM_SAMPLES, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # ---- Demographics ----
    age = rng.integers(18, 81, size=n)
    gender = rng.choice(["male", "female"], size=n)

    # ---- Questionnaire (static profile) ----
    bmi = rng.normal(loc=25.5, scale=5.0, size=n).clip(15, 45).round(1)
    smoker = rng.choice([0, 1], size=n, p=[0.78, 0.22]).astype(int)
    alcohol_frequency = rng.choice(
        ["never", "occasional", "regular"], size=n, p=[0.35, 0.45, 0.20]
    )
    exercise_frequency = rng.choice(
        ["sedentary", "light", "moderate", "active"], size=n, p=[0.20, 0.30, 0.30, 0.20]
    )
    pre_existing_conditions_count = rng.poisson(lam=0.4, size=n).clip(0, 5)
    family_history_count = rng.poisson(lam=0.6, size=n).clip(0, 5)

    # ---- Wearable metrics (daily averages) ----
    # Steps depend on exercise frequency
    exercise_map = {"sedentary": 3500, "light": 6000, "moderate": 9000, "active": 13000}
    base_steps = np.array([exercise_map[e] for e in exercise_frequency], dtype=float)
    steps = (base_steps + rng.normal(0, 2000, size=n)).clip(0, 25000).astype(int)

    # Active minutes correlated with exercise
    active_map = {"sedentary": 8, "light": 20, "moderate": 40, "active": 70}
    base_active = np.array([active_map[e] for e in exercise_frequency], dtype=float)
    active_minutes = (base_active + rng.normal(0, 10, size=n)).clip(0, 120).astype(int)

    # Sleep hours — roughly normal around 7
    sleep_hours = rng.normal(loc=7.0, scale=1.2, size=n).clip(3, 12).round(1)

    # Resting heart rate — lower is better, smokers & sedentary higher
    base_hr = 68.0
    hr_adjustment = (
        smoker * 6
        + np.where(np.isin(exercise_frequency, ["sedentary"]), 8, 0)
        + np.where(np.isin(exercise_frequency, ["active"]), -6, 0)
        + (age - 30) * 0.12
    )
    resting_heart_rate = (base_hr + hr_adjustment + rng.normal(0, 6, size=n)).clip(45, 130).astype(int)

    # Calories burned (correlated with steps & active minutes)
    calories_burned = (steps * 0.04 + active_minutes * 5 + rng.normal(0, 80, size=n)).clip(100, 3500).astype(int)

    # Distance km (correlated with steps)
    distance_km = (steps * 0.0008 + rng.normal(0, 0.5, size=n)).clip(0, 25).round(2)

    # ---- Compute target: health_risk_score (0-100, higher = healthier) ----
    score = np.full(n, 50.0)

    # Steps contribution (max +15)
    step_targets = np.where(age < 40, 10000, np.where(age < 60, 8000, 6000))
    step_ratio = (steps / step_targets).clip(0, 1.5)
    score += step_ratio * 10  # 0 to +15

    # Active minutes contribution (max +12)
    active_target = np.where(age < 60, 30, 20)
    active_ratio = (active_minutes / active_target).clip(0, 2)
    score += active_ratio * 6  # 0 to +12

    # Sleep contribution (max +10, penalty for too little or too much)
    sleep_penalty = np.abs(sleep_hours - 7.5)
    score += np.where(sleep_penalty < 1.0, 10, np.where(sleep_penalty < 2.0, 6, 2))

    # Heart rate contribution (max +8, lower is better within range)
    hr_score = np.where(resting_heart_rate < 60, 8,
               np.where(resting_heart_rate < 75, 6,
               np.where(resting_heart_rate < 90, 3, 0)))
    score += hr_score

    # BMI penalty (optimal 18.5-24.9)
    bmi_penalty = np.where((bmi >= 18.5) & (bmi <= 24.9), 0,
                  np.where((bmi >= 25) & (bmi <= 29.9), -4,
                  np.where(bmi >= 30, -10,
                  np.where(bmi < 18.5, -5, 0))))
    score += bmi_penalty

    # Smoker penalty
    score -= smoker * 12

    # Alcohol penalty
    alcohol_penalty = np.where(np.isin(alcohol_frequency, ["regular"]), -6,
                     np.where(np.isin(alcohol_frequency, ["occasional"]), -1, 0))
    score += alcohol_penalty

    # Pre-existing conditions penalty
    score -= pre_existing_conditions_count * 4

    # Family history (mild penalty)
    score -= family_history_count * 1.5

    # Age adjustment (slight decline with age)
    score -= (age - 30).clip(0, None) * 0.08

    # Add realistic noise
    score += rng.normal(0, 3, size=n)

    # Clamp to 0-100
    health_risk_score = score.clip(0, 100).round(1)

    # ---- Build DataFrame ----
    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "bmi": bmi,
        "smoker": smoker,
        "alcohol_frequency": alcohol_frequency,
        "exercise_frequency": exercise_frequency,
        "pre_existing_conditions_count": pre_existing_conditions_count,
        "family_history_count": family_history_count,
        "steps": steps,
        "active_minutes": active_minutes,
        "sleep_hours": sleep_hours,
        "resting_heart_rate": resting_heart_rate,
        "calories_burned": calories_burned,
        "distance_km": distance_km,
        "health_risk_score": health_risk_score,
    })

    return df


def main():
    print(f"Generating {NUM_SAMPLES} synthetic health profiles...")
    df = generate_data()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved to {OUTPUT_PATH}")

    print("\n--- Dataset Summary ---")
    print(df.describe().round(2).to_string())
    print(f"\nTarget (health_risk_score) distribution:")
    print(f"  Mean:   {df['health_risk_score'].mean():.1f}")
    print(f"  Median: {df['health_risk_score'].median():.1f}")
    print(f"  Std:    {df['health_risk_score'].std():.1f}")
    print(f"  Min:    {df['health_risk_score'].min():.1f}")
    print(f"  Max:    {df['health_risk_score'].max():.1f}")


if __name__ == "__main__":
    main()

