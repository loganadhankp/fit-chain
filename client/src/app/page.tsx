"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Activity, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">HealthChain</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight">
          Your Health,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Your Premium
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
          The first dynamic NFT health insurance platform. Connect your wearable,
          stay healthy, and watch your premiums drop in real-time — all secured on
          the blockchain.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Start Saving Today
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Activity,
              title: "Connect Wearable",
              desc: "Link your Fitbit or Google Fit to securely share health metrics.",
            },
            {
              icon: Heart,
              title: "Stay Healthy",
              desc: "Walk more, sleep better, and keep your heart rate in check.",
            },
            {
              icon: Zap,
              title: "Dynamic NFT Policy",
              desc: "Your insurance policy is a living NFT that updates with your health data.",
            },
            {
              icon: Shield,
              title: "Lower Premiums",
              desc: "Earn up to 20% discount as your health score improves over time.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} HealthChain. Built for a better
          future of health insurance.
        </div>
      </footer>
    </div>
  );
}
