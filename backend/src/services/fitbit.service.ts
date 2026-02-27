import axios from "axios";
import prisma from "../lib/prisma";

const FITBIT_API_BASE = "https://api.fitbit.com/1/user/-";

/**
 * Fetch data from Fitbit API and store normalised metrics in the database.
 * Pulls the last 7 days of activity, sleep, and heart-rate data.
 */
export async function syncFitbitData(userId: string, accessToken: string): Promise<void> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  try {
    // Fetch activities (steps, calories, distance, active minutes)
    const [activityRes, sleepRes, heartRes] = await Promise.all([
      axios.get(
        `${FITBIT_API_BASE}/activities/date/${sevenDaysAgo}/${today}.json`,
        { headers }
      ).catch(() => null),
      axios.get(
        `${FITBIT_API_BASE}/sleep/date/${sevenDaysAgo}/${today}.json`,
        { headers }
      ).catch(() => null),
      axios.get(
        `${FITBIT_API_BASE}/activities/heart/date/${sevenDaysAgo}/${today}.json`,
        { headers }
      ).catch(() => null),
    ]);

    // Parse daily activity data
    const activityDays: Record<string, { steps: number; calories: number; distance: number; activeMinutes: number }> = {};
    if (activityRes?.data?.["activities-steps"]) {
      for (const d of activityRes.data["activities-steps"]) {
        const date = d.dateTime;
        if (!activityDays[date]) activityDays[date] = { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
        activityDays[date].steps = parseInt(d.value) || 0;
      }
    }
    if (activityRes?.data?.["activities-calories"]) {
      for (const d of activityRes.data["activities-calories"]) {
        if (!activityDays[d.dateTime]) activityDays[d.dateTime] = { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
        activityDays[d.dateTime].calories = parseInt(d.value) || 0;
      }
    }
    if (activityRes?.data?.["activities-minutesFairlyActive"]) {
      for (const d of activityRes.data["activities-minutesFairlyActive"]) {
        if (!activityDays[d.dateTime]) activityDays[d.dateTime] = { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
        activityDays[d.dateTime].activeMinutes += parseInt(d.value) || 0;
      }
    }
    if (activityRes?.data?.["activities-minutesVeryActive"]) {
      for (const d of activityRes.data["activities-minutesVeryActive"]) {
        if (!activityDays[d.dateTime]) activityDays[d.dateTime] = { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
        activityDays[d.dateTime].activeMinutes += parseInt(d.value) || 0;
      }
    }

    // Parse sleep data
    const sleepByDate: Record<string, number> = {};
    if (sleepRes?.data?.sleep) {
      for (const s of sleepRes.data.sleep) {
        const date = s.dateOfSleep;
        sleepByDate[date] = (sleepByDate[date] || 0) + (s.duration || 0) / 3600000; // ms -> hours
      }
    }

    // Parse heart rate data
    const heartByDate: Record<string, number> = {};
    if (heartRes?.data?.["activities-heart"]) {
      for (const h of heartRes.data["activities-heart"]) {
        if (h.value?.restingHeartRate) {
          heartByDate[h.dateTime] = h.value.restingHeartRate;
        }
      }
    }

    // Collect all unique dates
    const allDates = new Set([
      ...Object.keys(activityDays),
      ...Object.keys(sleepByDate),
      ...Object.keys(heartByDate),
    ]);

    // Upsert each day
    for (const date of allDates) {
      const activity = activityDays[date] || { steps: 0, calories: 0, distance: 0, activeMinutes: 0 };
      const sleep = sleepByDate[date] || 0;
      const heartRate = heartByDate[date];

      await prisma.healthMetric.upsert({
        where: { userId_metricDate: { userId, metricDate: new Date(date) } },
        update: {
          steps: activity.steps,
          activeMinutes: activity.activeMinutes,
          caloriesBurned: activity.calories,
          sleepHours: sleep,
          restingHeartRate: heartRate ?? undefined,
          dataSource: "fitbit",
        },
        create: {
          userId,
          metricDate: new Date(date),
          steps: activity.steps,
          activeMinutes: activity.activeMinutes,
          caloriesBurned: activity.calories,
          sleepHours: sleep,
          restingHeartRate: heartRate ?? undefined,
          dataSource: "fitbit",
        },
      });
    }

    console.log(`Fitbit sync complete for user ${userId}: ${allDates.size} days`);
  } catch (error) {
    console.error("Fitbit sync error:", error);
    throw new Error("Failed to sync Fitbit data");
  }
}

