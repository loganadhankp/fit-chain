import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed the database with demo data for presentation.
 * Creates demo users, vendors, policy templates, health questionnaire,
 * health metrics/scores, and a sample insurance policy.
 */
async function main() {
  console.log("Seeding database...\n");

  // ---------------------------------------------------------------
  //  1. Create demo user
  // ---------------------------------------------------------------
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@healthchain.io" },
    update: {},
    create: {
      email: "demo@healthchain.io",
      passwordHash,
      walletAddress: null,
      role: "user",
    },
  });
  console.log(`✓ Demo user: ${user.email} (password: demo1234)`);

  // ---------------------------------------------------------------
  //  2. Create admin user
  // ---------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@healthchain.io" },
    update: {},
    create: {
      email: "admin@healthchain.io",
      passwordHash: await bcrypt.hash("admin1234", 12),
      role: "admin",
    },
  });
  console.log(`✓ Admin user: ${admin.email} (password: admin1234)`);

  // ---------------------------------------------------------------
  //  3. Create vendor accounts (insurance providers)
  // ---------------------------------------------------------------
  const vendorHash = await bcrypt.hash("vendor1234", 12);

  const safeLife = await prisma.vendor.upsert({
    where: { email: "contact@safelife.io" },
    update: {},
    create: {
      companyName: "SafeLife Insurance",
      email: "contact@safelife.io",
      passwordHash: vendorHash,
      licenseNumber: "INS-2024-SL-001",
      description:
        "SafeLife Insurance offers affordable, technology-driven health insurance plans that reward healthy lifestyles. Founded in 2020, we are pioneers in dynamic premium pricing.",
      isVerified: true,
    },
  });
  console.log(`✓ Vendor: ${safeLife.companyName} (${safeLife.email} / vendor1234) [verified]`);

  const wellGuard = await prisma.vendor.upsert({
    where: { email: "info@wellguard.io" },
    update: {},
    create: {
      companyName: "WellGuard Health",
      email: "info@wellguard.io",
      passwordHash: vendorHash,
      licenseNumber: "INS-2024-WG-002",
      description:
        "WellGuard Health provides comprehensive health coverage with a focus on preventive care. Our dynamic NFT policies give you real-time visibility into your coverage.",
      isVerified: true,
    },
  });
  console.log(`✓ Vendor: ${wellGuard.companyName} (${wellGuard.email} / vendor1234) [verified]`);

  // ---------------------------------------------------------------
  //  4. Create policy templates
  // ---------------------------------------------------------------
  const templates = [
    // SafeLife templates
    {
      vendorId: safeLife.id,
      planName: "SafeLife Bronze",
      description: "Essential health coverage with basic benefits. Great for young, healthy individuals who want affordable baseline protection.",
      basePremium: 99.0,
      coverageAmount: 25000.0,
      coverageTier: 1,
      policyType: "health",
      minHealthScore: 0,
      maxDiscountPercentage: 15,
      durationMonths: 12,
    },
    {
      vendorId: safeLife.id,
      planName: "SafeLife Silver",
      description: "Enhanced coverage including outpatient care, specialist visits, and prescription drugs. Ideal for active adults.",
      basePremium: 199.0,
      coverageAmount: 50000.0,
      coverageTier: 2,
      policyType: "health",
      minHealthScore: 40,
      maxDiscountPercentage: 18,
      durationMonths: 12,
    },
    {
      vendorId: safeLife.id,
      planName: "SafeLife Gold",
      description: "Comprehensive health plan covering hospitalisation, surgery, dental, and vision. Best value for families.",
      basePremium: 349.0,
      coverageAmount: 100000.0,
      coverageTier: 3,
      policyType: "health",
      minHealthScore: 55,
      maxDiscountPercentage: 20,
      durationMonths: 12,
    },
    // WellGuard templates
    {
      vendorId: wellGuard.id,
      planName: "WellGuard Starter",
      description: "Budget-friendly coverage for essential medical needs. Includes emergency care and basic hospitalisation.",
      basePremium: 79.0,
      coverageAmount: 20000.0,
      coverageTier: 1,
      policyType: "health",
      minHealthScore: 0,
      maxDiscountPercentage: 12,
      durationMonths: 12,
    },
    {
      vendorId: wellGuard.id,
      planName: "WellGuard Premium",
      description: "Full-spectrum health insurance with mental health support, physiotherapy, and alternative medicine coverage.",
      basePremium: 279.0,
      coverageAmount: 75000.0,
      coverageTier: 3,
      policyType: "health",
      minHealthScore: 50,
      maxDiscountPercentage: 20,
      durationMonths: 12,
    },
    {
      vendorId: wellGuard.id,
      planName: "WellGuard Platinum Elite",
      description: "Our top-tier plan with unlimited coverage, global hospital network access, and concierge medical services.",
      basePremium: 499.0,
      coverageAmount: 200000.0,
      coverageTier: 4,
      policyType: "health",
      minHealthScore: 70,
      maxDiscountPercentage: 20,
      durationMonths: 12,
    },
  ];

  for (const t of templates) {
    await prisma.policyTemplate.upsert({
      where: {
        id: undefined as unknown as string, // force create
      },
      update: {},
      create: t,
    }).catch(async () => {
      // upsert without unique key — just create if not exists by name+vendor
      const existing = await prisma.policyTemplate.findFirst({
        where: { vendorId: t.vendorId, planName: t.planName },
      });
      if (!existing) {
        await prisma.policyTemplate.create({ data: t });
      }
    });
  }

  const templateCount = await prisma.policyTemplate.count();
  console.log(`✓ Created ${templateCount} policy templates`);

  // ---------------------------------------------------------------
  //  5. Create health questionnaire for demo user
  // ---------------------------------------------------------------
  const existingQ = await prisma.healthQuestionnaire.findFirst({
    where: { userId: user.id },
  });

  if (!existingQ) {
    await prisma.healthQuestionnaire.create({
      data: {
        userId: user.id,
        heightCm: 175.0,
        weightKg: 72.0,
        bmi: 23.5,
        smoker: false,
        alcoholFrequency: "occasional",
        exerciseFrequency: "moderate",
        preExistingConditions: [],
        familyHistory: ["diabetes"],
        medications: [],
      },
    });
    console.log("✓ Created health questionnaire for demo user");
  }

  // ---------------------------------------------------------------
  //  6. Generate 30 days of health metrics
  // ---------------------------------------------------------------
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayProgress = (30 - i) / 30;
    const steps = Math.round(6000 + dayProgress * 4000 + Math.random() * 2000);
    const activeMinutes = Math.round(15 + dayProgress * 25 + Math.random() * 10);
    const sleepHours = parseFloat((6.5 + dayProgress * 1.5 + Math.random() * 0.5).toFixed(1));
    const restingHeartRate = Math.round(78 - dayProgress * 10 + Math.random() * 5);

    await prisma.healthMetric.upsert({
      where: { userId_metricDate: { userId: user.id, metricDate: new Date(dateStr) } },
      update: { steps, activeMinutes, sleepHours, restingHeartRate, dataSource: "seed" },
      create: {
        userId: user.id,
        metricDate: new Date(dateStr),
        steps,
        activeMinutes,
        sleepHours,
        restingHeartRate,
        caloriesBurned: Math.round(steps * 0.04 + activeMinutes * 5),
        distanceKm: parseFloat((steps * 0.0008).toFixed(2)),
        dataSource: "seed",
      },
    });

    const stepsScore = clampScore(Math.round((steps / 10000) * 100));
    const activityScore = clampScore(Math.round((activeMinutes / 30) * 100));
    const sleepScore =
      sleepHours >= 7 && sleepHours <= 9 ? 100 : clampScore(Math.round(70 + Math.random() * 20));
    const heartScore =
      restingHeartRate < 70 ? 95 : clampScore(Math.round(100 - (restingHeartRate - 60)));

    const overallScore = clampScore(
      Math.round(stepsScore * 0.25 + activityScore * 0.3 + sleepScore * 0.25 + heartScore * 0.2)
    );

    const trend = dayProgress > 0.5 ? "improving" : "stable";

    await prisma.healthScore.upsert({
      where: { userId_scoreDate: { userId: user.id, scoreDate: new Date(dateStr) } },
      update: { overallScore, stepsScore, activityScore, sleepScore, heartScore, trend },
      create: {
        userId: user.id,
        scoreDate: new Date(dateStr),
        overallScore,
        stepsScore,
        activityScore,
        sleepScore,
        heartScore,
        trend,
      },
    });
  }
  console.log("✓ Created 31 days of health metrics and scores");

  // ---------------------------------------------------------------
  //  7. Create a sample approved policy (so demo user can mint)
  // ---------------------------------------------------------------
  const sampleTemplate = await prisma.policyTemplate.findFirst({
    where: { vendorId: safeLife.id, planName: "SafeLife Silver" },
  });

  const questionnaire = await prisma.healthQuestionnaire.findFirst({
    where: { userId: user.id },
  });

  if (sampleTemplate && questionnaire) {
    const policy = await prisma.insurancePolicy.upsert({
      where: { policyNumber: "HC-DEMO-001" },
      update: {},
      create: {
        userId: user.id,
        vendorId: safeLife.id,
        templateId: sampleTemplate.id,
        questionnaireId: questionnaire.id,
        policyNumber: "HC-DEMO-001",
        basePremium: Number(sampleTemplate.basePremium),
        coverageAmount: Number(sampleTemplate.coverageAmount),
        coverageTier: sampleTemplate.coverageTier,
        policyType: sampleTemplate.policyType,
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        status: "approved",
        initialHealthScore: 78,
        vendorNotes: "Good health profile. Application approved.",
        reviewedAt: new Date(today.getFullYear(), today.getMonth() - 1, 2),
      },
    });

    console.log(`✓ Demo policy: ${policy.policyNumber} (approved, ready to mint)`);

    // Create policy update history
    const scores = await prisma.healthScore.findMany({
      where: { userId: user.id },
      orderBy: { scoreDate: "desc" },
      take: 4,
    });

    // Clear old updates to avoid duplicates
    await prisma.policyUpdate.deleteMany({ where: { policyId: policy.id } });

    for (const score of scores) {
      const discount =
        score.overallScore >= 90
          ? 20
          : score.overallScore >= 80
          ? 15
          : score.overallScore >= 70
          ? 10
          : score.overallScore >= 60
          ? 5
          : 0;
      const newPremium = Number(sampleTemplate.basePremium) * (1 - discount / 100);
      const tier =
        score.overallScore >= 85 ? 4 : score.overallScore >= 70 ? 3 : score.overallScore >= 55 ? 2 : 1;

      await prisma.policyUpdate.create({
        data: {
          policyId: policy.id,
          healthScore: score.overallScore,
          discountPercentage: discount,
          newPremium,
          coverageTier: tier,
        },
      });
    }
    console.log("✓ Created policy update history");
  }

  // ---------------------------------------------------------------
  //  Summary
  // ---------------------------------------------------------------
  console.log("\n--- Seed Complete ---");
  console.log("User:    demo@healthchain.io / demo1234");
  console.log("Admin:   admin@healthchain.io / admin1234");
  console.log(`Vendor:  ${safeLife.email} / vendor1234`);
  console.log(`Vendor:  ${wellGuard.email} / vendor1234`);
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, v));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
