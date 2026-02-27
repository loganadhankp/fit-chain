# HealthChain — Dynamic NFT Health Insurance Platform

A production-grade decentralized health insurance system that stores policies as **dynamic NFTs** on the Polygon blockchain. Real-time wearable device data from Fitbit and Google Fit drives a health scoring engine that automatically adjusts premiums and coverage tiers, creating the first "living insurance policy" that rewards healthy behavior.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Key Innovation](#key-innovation)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Smart Contract](#smart-contract)
- [Backend API](#backend-api)
- [Frontend Application](#frontend-application)
- [AI Service](#ai-service)
- [Oracle Service](#oracle-service)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [License](#license)

---

## Problem Statement

Traditional health insurance models charge fixed premiums that ignore real-time healthy behaviors. Policyholders have no financial incentive to maintain healthy lifestyles, and insurers have no transparent mechanism to reward them. HealthChain solves this by:

- Storing insurance policies as **dynamic ERC-721 NFTs** on the Polygon blockchain
- Integrating with **wearable devices** (Fitbit, Google Fit) for real-time health metrics
- **Automatically updating** policy terms (premium, tier, discount) based on oracle-verified health data
- Providing **premium discounts of up to 20%** for maintaining healthy behaviors
- Ensuring **transparency and immutability** in all insurance records

## Key Innovation

NFT metadata dynamically updates based on oracle-verified health data from wearable devices. An on-chain oracle service reads aggregated health scores daily and pushes updates to the smart contract, which recalculates discounts and coverage tiers in real time — creating a living, evolving insurance policy.

---

## Architecture

```
┌─────────────────┐
│ Wearable Devices │  (Fitbit, Google Fit)
└────────┬────────┘
         │ OAuth 2.0 + REST API
         ▼
┌─────────────────┐       ┌──────────────┐
│   Backend API   │◄─────►│  PostgreSQL   │
│  (Express.js)   │       │  + Redis      │
└────────┬────────┘       └──────────────┘
         │                        ▲
         ▼                        │
┌─────────────────┐       ┌──────┴───────┐
│   AI Service    │       │Oracle Service │
│   (FastAPI)     │       │  (node-cron)  │
└─────────────────┘       └──────┬───────┘
                                 │ ethers.js
                                 ▼
                        ┌─────────────────┐
                        │  Smart Contract  │
                        │ (Polygon / ERC-721)│
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Frontend      │
                        │   (Next.js 14)   │◄── wagmi + MetaMask
                        └─────────────────┘
```

### Data Flow

1. **Collect** — User authorizes a wearable; backend fetches health metrics via OAuth.
2. **Process** — Backend calculates a weighted health score (steps, activity, sleep, heart rate).
3. **Predict** — AI microservice provides an ML-based risk score with confidence.
4. **Store** — Encrypted health data goes to PostgreSQL; aggregated scores are cached in Redis.
5. **Update** — Oracle cron job reads scores and submits an `updateHealthScore` transaction to the blockchain.
6. **Reflect** — Smart contract recalculates discount and tier; NFT metadata updates on-chain.
7. **Display** — Frontend reads on-chain state via wagmi and renders the updated policy dashboard.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Solidity ^0.8.20, Hardhat, OpenZeppelin, Polygon (Mumbai testnet / Mainnet) |
| **Backend** | Node.js 18+, Express.js, TypeScript, Prisma ORM, PostgreSQL 15, Redis 7, ethers.js v6 |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, wagmi v2, viem, Zustand, Recharts, TanStack Query |
| **AI / ML** | Python 3.12, FastAPI, scikit-learn (risk prediction model) |
| **Oracle** | Node.js, node-cron, ethers.js v6, Prisma |
| **Wearables** | Fitbit API (OAuth 2.0), Google Fit API (OAuth 2.0) |
| **Infrastructure** | Docker, Docker Compose, IPFS (Pinata) |
| **Security** | AES-256-GCM encryption, JWT, bcrypt, Helmet, express-rate-limit, Zod validation |

---

## Project Structure

```
fit-chain/
├── blockchain/              # Smart contracts & deployment
│   ├── contracts/
│   │   └── HealthInsuranceNFT.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── HealthInsuranceNFT.test.ts
│   ├── hardhat.config.ts
│   └── package.json
│
├── backend/                 # Express.js API server
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic (health score, fitbit, AI)
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── lib/             # Prisma client, Redis, encryption
│   │   ├── types/           # TypeScript interfaces
│   │   └── server.ts        # App entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                # Next.js 14 web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/                # User login
│   │   │   ├── register/             # User registration
│   │   │   ├── dashboard/            # Authenticated user pages
│   │   │   │   ├── page.tsx          # Dashboard home
│   │   │   │   ├── health/           # Health metrics & charts
│   │   │   │   ├── policy/           # Policy management & NFT minting
│   │   │   │   ├── wearables/        # Connect wearable devices
│   │   │   │   ├── browse-plans/     # Browse policy templates
│   │   │   │   ├── questionnaire/    # Health questionnaire
│   │   │   │   └── settings/         # User settings
│   │   │   └── vendor/               # Insurance vendor portal
│   │   │       ├── dashboard/        # Vendor dashboard
│   │   │       ├── applications/     # Review applications
│   │   │       ├── templates/        # Manage policy templates
│   │   │       ├── login/
│   │   │       └── register/
│   │   ├── components/
│   │   │   ├── dashboard/            # HealthScoreGauge, AIScoreGauge, PolicyCard, StatsCard
│   │   │   ├── web3/                 # ConnectWallet
│   │   │   ├── layout/              # Sidebar
│   │   │   └── ui/                  # shadcn/ui primitives
│   │   ├── hooks/                   # use-toast
│   │   ├── lib/                     # API client, contracts, wagmi config, utils
│   │   └── store/                   # Zustand stores (user + vendor)
│   ├── Dockerfile
│   └── package.json
│
├── oracle-service/          # Blockchain oracle cron service
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/              # Python ML risk prediction
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── model.py         # ML model loading & inference
│   │   └── schemas.py       # Pydantic schemas
│   ├── models/              # Trained model artifacts
│   ├── scripts/             # Data generation & training scripts
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml       # PostgreSQL, Redis, AI service
├── .env.example             # Environment variable template
├── .gitignore
└── README.md
```

---

## Features

### User Portal

| Feature | Description |
|---|---|
| **Registration & Login** | Email/password auth with JWT tokens |
| **Wallet Connection** | Link MetaMask wallet via wagmi; address stored on backend |
| **Wearable Integration** | OAuth 2.0 flow for Fitbit and Google Fit; automatic and manual data sync |
| **Health Dashboard** | Interactive charts (steps, sleep, heart rate, active minutes) powered by Recharts |
| **Dual Health Scoring** | Rule-based weighted score + AI/ML risk prediction with confidence levels |
| **Browse Plans** | Filter insurance templates by tier (Bronze/Silver/Gold/Platinum) |
| **Health Questionnaire** | 3-step form (Physical, Lifestyle, Medical) for risk assessment |
| **Policy Application** | Apply for a plan; application goes to vendor for review |
| **NFT Minting** | Mint approved policy as an ERC-721 NFT on Polygon |
| **Dynamic Premium** | On-chain premium recalculation with up to 20% discount based on health score |
| **Policy Lifecycle** | View status, update history, coverage tier, and blockchain transaction hashes |

### Vendor Portal

| Feature | Description |
|---|---|
| **Vendor Registration** | Company registration with license verification |
| **Template Management** | Create, update, and deactivate policy templates |
| **Application Review** | Approve or reject user applications with notes |
| **Dashboard Analytics** | Overview of policies, applications, and revenue |

### Blockchain

| Feature | Description |
|---|---|
| **Dynamic NFT** | ERC-721 with mutable `PolicyData` struct (health score, discount, tier) |
| **Oracle Updates** | Automated daily health score push to smart contract |
| **Tiered Discounts** | 0% (<60), 5% (60-69), 10% (70-79), 15% (80-89), 20% (90-100) |
| **Coverage Tiers** | Bronze (<55), Silver (55-69), Gold (70-84), Platinum (85+) |
| **Access Control** | Role-based (Admin, Oracle) using OpenZeppelin AccessControl |
| **Emergency Pause** | Pausable contract with per-policy and global pause |
| **Rate Limiting** | 24-hour cooldown between oracle updates per policy |

---

## Smart Contract

**Contract:** `HealthInsuranceNFT.sol`

Built on OpenZeppelin's ERC-721, AccessControl, Pausable, and ReentrancyGuard.

### PolicyData Struct

```solidity
struct PolicyData {
    uint256 policyId;
    address policyHolder;
    uint256 basePremium;          // in wei
    uint256 healthScore;          // 0–100
    uint256 discountPercentage;   // 0–20
    uint256 coverageTier;         // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
    uint256 lastUpdated;
    bool    isActive;
    string  ipfsMetadataHash;
}
```

### Key Functions

| Function | Access | Description |
|---|---|---|
| `mintPolicy(to, basePremium, ipfsHash)` | Admin | Mint a new policy NFT |
| `updateHealthScore(tokenId, newScore)` | Oracle | Update health score (24h cooldown enforced) |
| `getCurrentPremium(tokenId)` | Public | Returns discounted premium |
| `calculateDiscount(healthScore)` | Pure | Returns discount percentage (0-20%) |
| `calculateTier(healthScore)` | Pure | Returns coverage tier (1-4) |
| `pausePolicy(tokenId)` / `resumePolicy(tokenId)` | Admin | Lifecycle management |
| `revokePolicy(tokenId)` | Admin | Cancel and burn NFT |

### Events

`PolicyMinted` · `HealthScoreUpdated` · `PremiumUpdated` · `TierUpgraded` · `PolicyPaused` · `PolicyResumed` · `PolicyRevoked`

---

## Backend API

Base URL: `http://localhost:3001/api`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Get current user profile |
| PUT | `/auth/profile` | Update profile |
| POST | `/auth/connect-wallet` | Link blockchain wallet |

### Health Metrics & Scoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health/metrics` | Get health metrics (filterable by date) |
| POST | `/health/metrics` | Store health metrics |
| GET | `/health/score` | Get current health score |
| GET | `/health/score/history` | Get health score history |
| GET | `/health/summary` | Get aggregated health summary |

### Wearable Integration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/wearables/auth-url/:provider` | Get OAuth URL (fitbit / google_fit) |
| POST | `/wearables/callback/:provider` | OAuth callback handler |
| GET | `/wearables/connected` | List connected wearables |
| POST | `/wearables/sync/:provider` | Manually trigger data sync |
| DELETE | `/wearables/:provider` | Disconnect wearable |
| GET | `/wearables/status/:provider` | Check connection status |

### Insurance Policies

| Method | Endpoint | Description |
|---|---|---|
| GET | `/policies/readiness` | Check application readiness |
| POST | `/policies/apply` | Apply for a new policy |
| GET | `/policies` | Get user's policies |
| GET | `/policies/:policyId` | Get specific policy details |
| POST | `/policies/:policyId/mint` | Mint policy as NFT |
| GET | `/policies/:policyId/premium` | Calculate current premium |
| GET | `/policies/:policyId/history` | Get policy update history |

### Health Questionnaire

| Method | Endpoint | Description |
|---|---|---|
| POST | `/questionnaire` | Submit health questionnaire |
| GET | `/questionnaire` | Get user's questionnaire |
| PUT | `/questionnaire` | Update questionnaire |

### Policy Templates (Public)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/templates/browse` | Browse available plan templates |

### Vendor Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/vendor/register` | Register insurance vendor |
| POST | `/vendor/login` | Vendor login |
| GET | `/vendor/me` | Get vendor profile |
| PUT | `/vendor/profile` | Update vendor profile |
| POST | `/templates` | Create policy template |
| GET | `/templates` | Get vendor's templates |
| PUT | `/templates/:id` | Update template |
| DELETE | `/templates/:id` | Delete template |
| GET | `/applications` | List applications |
| GET | `/applications/:id` | Get application detail |
| POST | `/applications/:id/approve` | Approve application |
| POST | `/applications/:id/reject` | Reject application |

---

## Frontend Application

Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

### Pages

| Route | Description |
|---|---|
| `/` | Landing page with hero section, feature highlights, and CTA |
| `/login` | User login form |
| `/register` | User registration form |
| `/dashboard` | Main dashboard — health score gauges, stats cards, policy summary |
| `/dashboard/health` | Health metrics with interactive Recharts (steps, sleep, heart rate, active minutes) |
| `/dashboard/policy` | Policy details, status, NFT minting, update history |
| `/dashboard/wearables` | Connect/disconnect Fitbit and Google Fit via OAuth |
| `/dashboard/browse-plans` | Browse and filter insurance plan templates by tier |
| `/dashboard/questionnaire` | 3-step health questionnaire (Physical → Lifestyle → Medical) |
| `/dashboard/settings` | User profile and preferences |
| `/vendor/login` | Vendor login |
| `/vendor/register` | Vendor registration |
| `/vendor/dashboard` | Vendor analytics overview |
| `/vendor/applications` | Review, approve, or reject policy applications |
| `/vendor/templates` | Create and manage policy templates |

### Key Components

- **HealthScoreGauge** — Circular gauge (0–100) with color coding and trend indicator
- **AIScoreGauge** — AI risk score gauge with risk category badge and confidence percentage
- **PolicyCard** — Policy card with tier badge, premium, discount, and health score
- **StatsCard** — Stat card with icon, value, and subtitle
- **ConnectWallet** — MetaMask wallet connection via wagmi with auto-link to backend
- **Sidebar** — Navigation sidebar for dashboard and vendor portal

### State Management

- **Zustand** stores for user state and vendor state
- **TanStack Query** for server state and data fetching
- **wagmi** hooks for Web3 state (wallet, chain, contract reads)

---

## AI Service

A **Python FastAPI** microservice that provides ML-based health risk prediction.

| Endpoint | Description |
|---|---|
| `GET /health` | Service health check |
| `POST /predict` | Predict risk score from health metrics |

**Input:** Age, BMI, steps, active minutes, sleep hours, resting heart rate, smoker status, exercise frequency, pre-existing conditions.

**Output:** `aiRiskScore` (0–100), `riskCategory` (low / moderate / high), `confidence` (0–1).

The model is trained using scripts in `ai-service/scripts/` and artifacts are stored in `ai-service/models/`.

---

## Oracle Service

A **Node.js** background service that bridges off-chain health data with the on-chain smart contract.

- **Schedule:** Runs daily at 3:00 AM via `node-cron`
- **Manual trigger:** `POST /trigger`
- **Health check:** `GET /health`

### Update Flow

1. Query all active, minted policies from PostgreSQL
2. Check 24-hour cooldown per policy
3. Fetch the latest health score for each policyholder
4. Call `updateHealthScore(tokenId, score)` on the smart contract via ethers.js
5. Log the result to `policy_updates` and `oracle_logs` tables
6. Wait 5 seconds between transactions (rate limiting)

Supports **dry-run mode** when blockchain configuration is incomplete.

---

## Database Schema

The backend uses **Prisma ORM** with **PostgreSQL**. Key models:

| Model | Description |
|---|---|
| **User** | Registered users with encrypted PII and wallet address |
| **Vendor** | Insurance companies with verification status |
| **PolicyTemplate** | Configurable plan templates created by vendors |
| **HealthQuestionnaire** | User-submitted health questionnaire data |
| **HealthMetric** | Daily raw metrics (steps, sleep, heart rate, etc.) from wearables |
| **HealthScore** | Calculated daily scores (overall + per-metric) with AI risk data |
| **WearableConnection** | OAuth tokens (encrypted) for connected wearable providers |
| **InsurancePolicy** | User policies with blockchain references (tokenId, txHash) |
| **PolicyUpdate** | History of oracle-driven policy updates |
| **AuditLog** | Access logging for sensitive resources |
| **OracleLog** | Oracle transaction success/failure records |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Docker** and **Docker Compose**
- **MetaMask** browser extension
- A **Polygon Mumbai** RPC URL (Alchemy or Infura)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fit-chain.git
cd fit-chain
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section)
```

### 3. Start Infrastructure (PostgreSQL, Redis, AI Service)

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 15** on port `5432`
- **Redis 7** on port `6379`
- **AI Service** (FastAPI) on port `8000`

### 4. Set Up the Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push        # Apply schema to database
npx prisma db seed         # Seed initial data (optional)
npm run dev                # Starts on http://localhost:3001
```

### 5. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev                # Starts on http://localhost:3000
```

### 6. Deploy Smart Contracts (Optional — for blockchain features)

```bash
cd blockchain
npm install
npx hardhat compile

# Deploy to local Hardhat network
npx hardhat node                                    # Terminal 1
npx hardhat run scripts/deploy.ts --network localhost  # Terminal 2

# Deploy to Polygon Mumbai testnet
npx hardhat run scripts/deploy.ts --network polygonMumbai

# Verify on PolygonScan
npx hardhat verify --network polygonMumbai <DEPLOYED_ADDRESS>
```

Update `NFT_CONTRACT_ADDRESS` in `.env` and `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` in `frontend/.env.local` with the deployed address.

### 7. Start the Oracle Service (Optional)

```bash
cd oracle-service
npm install
npx prisma generate
npm run dev                # Starts on http://localhost:3002
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 characters) |
| `JWT_EXPIRY` | Token expiration (e.g., `7d`) |
| `ENCRYPTION_KEY` | 64-char hex string for AES-256-GCM encryption |
| `BLOCKCHAIN_RPC_URL` | Polygon Mumbai RPC endpoint |
| `ORACLE_PRIVATE_KEY` | Private key for the oracle wallet |
| `ORACLE_WALLET_ADDRESS` | Oracle wallet address |
| `NFT_CONTRACT_ADDRESS` | Deployed HealthInsuranceNFT contract address |
| `CHAIN_ID` | `80001` (Mumbai) or `137` (Polygon Mainnet) |
| `FITBIT_CLIENT_ID` | Fitbit OAuth app client ID |
| `FITBIT_CLIENT_SECRET` | Fitbit OAuth app client secret |
| `FITBIT_REDIRECT_URI` | Fitbit OAuth redirect URI |
| `GOOGLE_FIT_CLIENT_ID` | Google Fit OAuth client ID |
| `GOOGLE_FIT_CLIENT_SECRET` | Google Fit OAuth client secret |
| `GOOGLE_FIT_REDIRECT_URI` | Google Fit OAuth redirect URI |
| `NEXT_PUBLIC_API_URL` | Backend API URL for the frontend |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID for frontend Web3 |
| `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` | Contract address for frontend |
| `IPFS_API_URL` | Pinata API URL |
| `IPFS_API_KEY` | Pinata API key |
| `IPFS_API_SECRET` | Pinata API secret |
| `PORT` | Backend server port (default `3001`) |
| `NODE_ENV` | `development` or `production` |
| `SENTRY_DSN` | Sentry error tracking DSN (optional) |
| `LOG_LEVEL` | Logging level (default `info`) |

---

## Deployment

### Docker Compose (Full Stack)

Uncomment the `backend`, `frontend`, and `oracle` services in `docker-compose.yml`, then:

```bash
docker-compose up -d --build
```

### Individual Service Deployment

| Service | Recommended Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway, Render, or DigitalOcean |
| Oracle Service | Railway or PM2 on a VPS |
| AI Service | Docker on any cloud provider |
| Smart Contracts | Polygon Mumbai (testnet) or Polygon Mainnet |
| Database | Managed PostgreSQL (Supabase, Railway, Neon) |
| Cache | Managed Redis (Upstash, Railway) |

### Smart Contract Deployment

```bash
cd blockchain

# Testnet
npx hardhat run scripts/deploy.ts --network polygonMumbai
npx hardhat verify --network polygonMumbai <ADDRESS>

# Mainnet
npx hardhat run scripts/deploy.ts --network polygon
npx hardhat verify --network polygon <ADDRESS>
```

---

## Testing

### Smart Contract Tests

```bash
cd blockchain
npx hardhat test
npx hardhat test --network hardhat    # With gas reporting
```

**Test coverage includes:**
- Policy minting and access control
- Health score updates with oracle authorization
- 24-hour cooldown enforcement
- Discount calculation (0%, 5%, 10%, 15%, 20%)
- Tier calculation (Bronze, Silver, Gold, Platinum)
- Premium calculation with discounts
- Policy lifecycle (pause, resume, revoke)
- NFT transfer with state sync
- Emergency pause mechanism
- Gas usage benchmarks (<300k mint, <150k update)

### Solidity Coverage

```bash
cd blockchain
npx hardhat coverage
```

---

## Security

### Data Protection

- **Encryption at rest**: All sensitive data (names, OAuth tokens) encrypted with AES-256-GCM
- **Encryption in transit**: HTTPS enforced; Helmet.js security headers
- **Password hashing**: bcrypt with salt rounds

### API Security

- **Authentication**: JWT tokens on all protected routes
- **Validation**: Zod schema validation on all inputs
- **Rate limiting**: express-rate-limit on all public endpoints
- **CORS**: Configured for allowed origins only

### Smart Contract Security

- **Access control**: Role-based (Admin, Oracle) via OpenZeppelin
- **Reentrancy guard**: On all state-changing functions
- **Rate limiting**: 24-hour cooldown per policy update
- **Emergency pause**: Global and per-policy pause mechanism
- **Input validation**: Score range checks, zero-address checks

### Audit Logging

- All access to sensitive health data is logged to the `AuditLog` table
- Oracle transactions logged to `OracleLog` with success/failure status

---

## Health Score Algorithm

The health score is a weighted composite of four metrics:

| Metric | Weight | Optimal Range |
|---|---|---|
| Steps | 25% | Age-adjusted (6,000–12,000/day) |
| Active Minutes | 30% | 20–30 min/day (age-adjusted) |
| Sleep | 25% | 7–9 hours/night |
| Resting Heart Rate | 20% | 60–100 bpm |

Each metric is scored 0–100, then combined using the weights above. The overall score maps to:

| Score Range | Discount | Tier |
|---|---|---|
| 90–100 | 20% | Platinum |
| 85–89 | 15% | Platinum |
| 80–84 | 15% | Gold |
| 70–79 | 10% | Gold |
| 55–69 | 5% | Silver |
| < 55 | 0% | Bronze |

---

## License

This project is developed as a final year university project. All rights reserved.
