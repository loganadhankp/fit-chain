"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  Heart,
  Watch,
  Zap,
  TrendingDown,
  ArrowRight,
  ChevronRight,
  Lock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Shield,
    title: "Dynamic NFT Policies",
    description: "Your insurance policy lives on the blockchain as an NFT that evolves with your health journey.",
  },
  {
    icon: Watch,
    title: "Wearable Integration",
    description: "Connect Fitbit or Google Fit to automatically track steps, sleep, heart rate, and more.",
  },
  {
    icon: TrendingDown,
    title: "Premium Discounts",
    description: "Earn up to 20% off your premium by maintaining a healthy lifestyle. Better scores mean lower costs.",
  },
  {
    icon: Zap,
    title: "AI-Powered Scoring",
    description: "Our AI model analyzes your health data to generate accurate risk scores and personalized insights.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "AES-256 encryption for all personal data. You control what gets shared and when.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track your health score trends, view detailed metrics, and see how your behavior impacts your policy.",
  },
];

const steps = [
  { step: "01", title: "Sign Up & Connect", description: "Create your account and link your wearable device." },
  { step: "02", title: "Track Your Health", description: "We automatically collect steps, sleep, heart rate, and activity data." },
  { step: "03", title: "Get Your Score", description: "Our algorithm calculates your health score from real-time data." },
  { step: "04", title: "Earn Rewards", description: "Higher health scores unlock premium discounts and tier upgrades." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm">
              <Activity className="mr-2 h-4 w-4 text-primary" />
              Blockchain-Powered Health Insurance
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Your Health, Your Policy,{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Your Rewards
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            HealthChain transforms health insurance with dynamic NFT policies that reward healthy
            behavior. Connect your wearables, improve your health score, and watch your premiums drop.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/auth/register">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="/vendor/register">Insurance Vendors</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8"
          >
            {[
              { value: "20%", label: "Max Discount" },
              { value: "4", label: "Coverage Tiers" },
              { value: "24/7", label: "Health Tracking" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A complete health insurance ecosystem powered by blockchain technology and real-time health data.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="group h-full transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Four simple steps to a smarter, more rewarding insurance experience.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative"
              >
                <div className="text-5xl font-black text-primary/10">{step.step}</div>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20 sm:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <Heart className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Ready to Take Control?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join HealthChain and start earning rewards for your healthy lifestyle today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Create Account <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/vendor/register">Register as Vendor</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">HealthChain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HealthChain. Built for academic demonstration.
          </p>
        </div>
      </footer>
    </div>
  );
}
