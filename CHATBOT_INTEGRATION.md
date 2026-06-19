# GrowDigitally Chatbot — Ecosystem Integration Guide

> **Goal**: Seamlessly run and connect the `GrowDigitally-Chatbot` (Node.js + MongoDB) alongside the main `grow-digitally-eco-system` (Python FastAPI + PostgreSQL) so both stacks cooperate as one unified platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [How the Two Stacks Relate](#2-how-the-two-stacks-relate)
3. [Port & Service Map](#3-port--service-map)
4. [Step-by-Step Integration](#4-step-by-step-integration)
   - [Step 1 — Install Prerequisites](#step-1--install-prerequisites)
   - [Step 2 — Configure Chatbot Environment Variables](#step-2--configure-chatbot-environment-variables)
   - [Step 3 — Add Chatbot to Docker Compose](#step-3--add-chatbot-to-docker-compose)
   - [Step 4 — Wire nginx to Proxy the Chatbot](#step-4--wire-nginx-to-proxy-the-chatbot)
   - [Step 5 — Share Authentication Tokens (SSO Bridge)](#step-5--share-authentication-tokens-sso-bridge)
   - [Step 6 — Embed the Chatbot Widget in the Main Frontend](#step-6--embed-the-chatbot-widget-in-the-main-frontend)
   - [Step 7 — CORS Alignment](#step-7--cors-alignment)
   - [Step 8 — Start Everything Locally](#step-8--start-everything-locally)
   - [Step 9 — Production Deployment](#step-9--production-deployment)
5. [Cross-Stack Data Sync (Optional Deep Integration)](#5-cross-stack-data-sync-optional-deep-integration)
6. [Environment Variable Reference](#6-environment-variable-reference)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Architecture Overview

```
grow-digitally-eco-system/
├── backend/python/               ← FastAPI microservices (Python 3.11, PostgreSQL)
│   ├── docker-compose.yml        ← Main orchestration file
│   └── src/python/               ← user-auth, platform, ai, commerce, growth, community
│
├── frontend/react/               ← React monorepo (Vite, npm workspaces)
│   └── apps/
│       ├── ai-dashboard/         :5177
│       ├── ai-website/           :5176
│       ├── admin/                :5174
│       └── org-platform/         :5178
│
└── GrowDigitally-Chatbot/        ← ★ New addition (Node.js, MongoDB)
    ├── server/                   ← Express 5 + Mongoose API  →  :3001 (local)
    │   ├── server.js
    │   ├── routes/               ← /api/chat  /api/business
    │   ├── controller/
    │   ├── models/               ← Business, Conversation, Message (MongoDB)
    │   └── .env
    └── client/                   ← React widget (Vite, embeddable via <script>)
        └── src/
```

### High-Level Integration Architecture

```
┌─────────────────── nginx :8080 ──────────────────────────────────────────┐
│                                                                           │
│  /api/auth/*        → user-auth     :8001  (Python/FastAPI/PostgreSQL)   │
│  /api/v1/*          → ai            :8005  (Python/FastAPI/PostgreSQL)   │
│  /api/admin/*       → platform      :8004  (Python/FastAPI/PostgreSQL)   │
│  /api/chatbot/*     → chatbot       :3001  ★ NEW (Node.js/Express/Mongo) │
│                                                                           │
│  ws-server          :3000           (Socket.io / Node.js / Redis)        │
└───────────────────────────────────────────────────────────────────────────┘

Databases:
  PostgreSQL  :5432   ← gd_user_auth, gd_ai, gd_platform, gd_commerce …
  MongoDB             ← Business, Conversation, Message (chatbot data)
  Redis       :6379   ← Sessions, pub/sub, caching

External:
  n8n                 ← AI chat webhook + website scraping/training
  OpenAI API          ← GPT model for chatbot replies
```

---

## 2. How the Two Stacks Relate

| Concern | Main Ecosystem (Python) | Chatbot (Node.js) | Integration Approach |
|---|---|---|---|
| **Runtime** | FastAPI (uvicorn) | Express 5 | Both run as Docker containers behind nginx |
| **Database** | PostgreSQL (`gd_*` DBs) | MongoDB Atlas | Kept separate — each DB is the source of truth for its domain |
| **Auth** | JWT issued by `user-auth` service | JWT verified from the same `JWT_SECRET` | Share secret → Chatbot validates ecosystem tokens |
| **Routing** | `/api/*` via nginx | `/api/chatbot/*` via nginx | New nginx location block → chatbot container |
| **Frontend** | React apps on :5174–5178 | Embeddable widget (`<script>` tag) | Widget injected into any GD frontend page |
| **AI** | AI service `:8005` (conversations, agents) | n8n webhook + OpenAI | Chatbot handles *external business visitors*; AI service handles *internal GD users* |

### Key Design Principle

> **The chatbot is a sidecar microservice.** It speaks HTTP with the rest of the ecosystem through nginx. No shared code, no shared database. The only shared state is the JWT secret (for token validation) and user identity (passed via HTTP headers).

---

## 3. Port & Service Map

| Service | Container Name | Local Port | Tech |
|---|---|---|---|
| nginx gateway | `gd_nginx_local` | **8080** | nginx |
| user-auth | `gd_user_auth_local` | 8001 | FastAPI / Python |
| commerce | `gd_commerce_local` | 8002 | FastAPI / Python |
| growth | `gd_growth_local` | 8003 | FastAPI / Python |
| platform | `gd_platform_local` | 8004 | FastAPI / Python |
| ai | `gd_ai_local` | 8005 | FastAPI / Python |
| community | `gd_community_local` | 8006 | FastAPI / Python |
| ws-server | `gd_ws_server_local` | 3000 | Node.js / Socket.io |
| **chatbot-server** | **`gd_chatbot_local`** | **3001** ★ | **Node.js / Express** |
| PostgreSQL | `gd_db_local` | 5432 | PostgreSQL 15 |
| Redis | `gd_redis_local` | 6379 | Redis 7.2 |
| **Chatbot Widget** | — | **5179** (dev only) | Vite (React) |

---

## 4. Step-by-Step Integration

### Step 1 — Install Prerequisites

Make sure you have all base requirements from the main README, plus:

```bash
# Verify Node.js (chatbot server needs Node ≥ 18)
node --version   # v18+
npm --version    # 9+

# Verify Docker is running
docker info
```

You also need a **MongoDB** connection. The chatbot uses MongoDB Atlas by default.  
Two options:
- ✅ **Keep MongoDB Atlas** (cloud, free tier) — simplest, nothing to install
- 🔧 **Add MongoDB as a local Docker container** — see [Step 3](#step-3--add-chatbot-to-docker-compose)

---

### Step 2 — Configure Chatbot Environment Variables

```bash
# From the repo root
cd GrowDigitally-Chatbot/server
cp env.example .env
```

Edit `GrowDigitally-Chatbot/server/.env`:

```env
# ── Server ───────────────────────────────────────────────────────
PORT=3001                             # ← change from 3000 (ws-server already uses it)

# ── Database ─────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=Cluster0
# OR for local MongoDB Docker: MONGODB_URI=mongodb://chatbot_user:chatbot_pass@mongodb:27017/gd_chatbot

# ── JWT (must match the main ecosystem) ──────────────────────────
JWT_SECRET=<same value as backend/python/config/.env.rds JWT_SECRET>

# ── n8n Webhooks ─────────────────────────────────────────────────
N8N_CHAT_WEBHOOK_URL=https://n8n.kasunpremarathna.com/webhook/<chat-id>
N8N_TRAIN_WEBHOOK=https://n8n.kasunpremarathna.com/webhook/<train-id>
N8N_CALLBACK_SECRET=<your_n8n_secret>
N8N_HOST=https://n8n.kasunpremarathna.com

# ── Widget ───────────────────────────────────────────────────────
# In development the widget is served by Vite on :5179
# In production it's the Vercel CDN URL
WIDGET_URL=http://localhost:5179/widget.js
WIDGET_ORIGIN=http://localhost:5179

# ── CORS: allow all local GD frontends ───────────────────────────
# (also configured programmatically in server.js — see Step 7)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5179,http://localhost:8080

# ── OpenAI ───────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# ── Cron secret (for /api/business/process-queue) ────────────────
CRON_SECRET=<your_cron_secret>
```

> **Important**: `PORT=3001` — the main ecosystem's WebSocket server (`ws-server`) already runs on `3000`. The chatbot must use a different port locally.

---

### Step 3 — Add Chatbot to Docker Compose

Open `backend/python/docker-compose.yml` and add two new service blocks:

#### 3a. Chatbot API Server

```yaml
  # ════════════════════════════════════════════════════════════════════════════
  # Chatbot Server  :3001  →  MongoDB
  # Routes (via nginx): /api/chatbot/chat/*  /api/chatbot/business/*
  # ════════════════════════════════════════════════════════════════════════════
  chatbot-server:
    build:
      context: ../../GrowDigitally-Chatbot/server
      dockerfile: Dockerfile
    container_name: gd_chatbot_local
    restart: unless-stopped
    env_file:
      - ../../GrowDigitally-Chatbot/server/.env
    environment:
      PORT: "3001"
      NODE_ENV: development
    ports:
      - "3001:3001"
    networks:
      - gd-internal
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```

#### 3b. (Optional) Local MongoDB Container

If you want to run MongoDB locally instead of Atlas:

```yaml
  # ════════════════════════════════════════════════════════════════════════════
  # MongoDB  — Chatbot data store (isolated from PostgreSQL)
  # ════════════════════════════════════════════════════════════════════════════
  mongodb:
    image: mongo:7.0
    container_name: gd_mongodb_local
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: gd_admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ADMIN_PASSWORD:-mongo_localdev_pass}
      MONGO_INITDB_DATABASE: gd_chatbot
    ports:
      - "127.0.0.1:27017:27017"   # internal only
    volumes:
      - mongodb_data:/data/db
    networks:
      - gd-internal
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

Then add `mongodb_data` to the `volumes:` section at the bottom of `docker-compose.yml`:

```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  mongodb_data:          # ← add this
    driver: local
```

And if using local MongoDB, update the chatbot's `MONGODB_URI`:

```env
MONGODB_URI=mongodb://gd_admin:mongo_localdev_pass@mongodb:27017/gd_chatbot?authSource=admin
```

#### 3c. Create a Dockerfile for the Chatbot Server

Create `GrowDigitally-Chatbot/server/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

---

### Step 4 — Wire nginx to Proxy the Chatbot

Open `backend/python/infra/docker/nginx/nginx.conf` and add a new `location` block **before** the generic `/api/` block:

```nginx
# ── Chatbot API  ──────────────────────────────────────────────────────────────
# Strips /api/chatbot prefix and forwards to the chatbot Node.js service.
# Example: GET /api/chatbot/chat/messages/session123
#       → GET /api/chat/messages/session123  (chatbot-server:3001)
location /api/chatbot/ {
    rewrite ^/api/chatbot/(.*) /api/$1 break;
    proxy_pass         http://chatbot-server:3001;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

> **Path convention**: All requests from the main ecosystem to the chatbot go through nginx at `/api/chatbot/*`. nginx strips that prefix and forwards the request as `/api/*` to `chatbot-server:3001`. This means the chatbot server code doesn't need to change.

Also update the `nginx` service `depends_on` block to include `chatbot-server`:

```yaml
  nginx:
    depends_on:
      user-auth:
        condition: service_healthy
      # ... existing services ...
      chatbot-server:
        condition: service_healthy    # ← add this
```

---

### Step 5 — Share Authentication Tokens (SSO Bridge)

The main ecosystem issues JWTs via the `user-auth` Python service. The chatbot needs to validate these same tokens when GD-authenticated users interact with the chatbot.

#### 5a. Add JWT Validation Middleware to Chatbot

Create `GrowDigitally-Chatbot/server/middlewares/verifyGDToken.js`:

```js
import jwt from "jsonwebtoken";

/**
 * Optional middleware: validates a GrowDigitally JWT token
 * sent in Authorization: Bearer <token>.
 *
 * If the token is valid, req.gdUser is populated.
 * If missing or invalid, req.gdUser stays null (guest visitor).
 * This allows both authenticated GD users and anonymous visitors to chat.
 */
export const verifyGDToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.gdUser = null;   // anonymous visitor — allowed
    return next();
  }

  const token = authHeader.slice(7);
  try {
    // JWT_SECRET must match the one used by the Python user-auth service
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.gdUser = {
      userId: payload.sub || payload.user_id,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    req.gdUser = null;   // expired / invalid — treat as anonymous
  }
  next();
};
```

#### 5b. Apply to Chat Routes (Optional)

If you want to track which GD user is chatting, update `GrowDigitally-Chatbot/server/routes/chatRoute.js`:

```js
import { verifyGDToken } from "../middlewares/verifyGDToken.js";

// Add verifyGDToken to routes that benefit from user context:
chatRouter.post("/message", chatLimiter, validateWidgetToken, verifyGDToken, sendMessage);
```

Then in `chatController.js`, you can optionally attach the GD user ID to the conversation:

```js
// Inside sendMessage():
const gdUserId = req.gdUser?.userId || null;
// ... persist gdUserId on the Conversation document if needed
```

---

### Step 6 — Embed the Chatbot Widget in the Main Frontend

The chatbot client produces an embeddable `<script>` tag. You can inject this into any GD React frontend.

#### 6a. Build the Widget

```bash
cd GrowDigitally-Chatbot/client
npm install
npm run build
# Output: dist/assets/index.js  (the widget bundle)
```

For **local development**, run the Vite dev server on port `5179` instead:

```bash
npm run dev -- --port 5179
```

#### 6b. Inject the Widget into a React App

In any GD React frontend (e.g., `frontend/react/apps/ai-dashboard`), add the widget script dynamically:

```jsx
// src/components/ChatbotWidget.jsx
import { useEffect } from "react";

/**
 * Injects the GrowDigitally Chatbot widget into the current page.
 * widgetToken is the token issued when this business registered with the chatbot.
 */
export function ChatbotWidget({ widgetToken }) {
  useEffect(() => {
    if (!widgetToken) return;

    // Use the local Vite dev server URL in development
    const widgetUrl =
      import.meta.env.VITE_CHATBOT_WIDGET_URL ||
      "https://grow-digitally-chatbot-6tky.vercel.app/widget.js";

    const script = document.createElement("script");
    script.src = widgetUrl;
    script.setAttribute("data-token", widgetToken);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [widgetToken]);

  return null; // widget mounts into its own Shadow DOM
}
```

Then use it in the app shell:

```jsx
// src/App.jsx or layout component
import { ChatbotWidget } from "./components/ChatbotWidget";

function App() {
  const widgetToken = import.meta.env.VITE_CHATBOT_WIDGET_TOKEN;
  return (
    <>
      {/* ... existing app content ... */}
      <ChatbotWidget widgetToken={widgetToken} />
    </>
  );
}
```

Add to the frontend's `.env`:

```env
# The widget token for this GD property (obtained from /api/chatbot/business/register)
VITE_CHATBOT_WIDGET_TOKEN=<your_widget_token>

# In local dev, point to the Vite dev server
VITE_CHATBOT_WIDGET_URL=http://localhost:5179/widget.js
# In production, point to the Vercel CDN
# VITE_CHATBOT_WIDGET_URL=https://grow-digitally-chatbot-6tky.vercel.app/widget.js
```

#### 6c. Update Chatbot Client API Base URL

Edit `GrowDigitally-Chatbot/client/.env`:

```env
# In local dev, all chatbot API calls go through nginx
VITE_REACT_APP_BACKEND_URL=http://localhost:8080/api/chatbot
```

---

### Step 7 — CORS Alignment

The chatbot server's `allowedOrigins` must include all GD frontend origins. Update `GrowDigitally-Chatbot/server/server.js`:

```js
const allowedOrigins = [
  // GrowDigitally frontends
  "http://localhost:5173",
  "http://localhost:5174",  // admin
  "http://localhost:5175",
  "http://localhost:5176",  // ai-website
  "http://localhost:5177",  // ai-dashboard
  "http://localhost:5178",  // org-platform
  "http://localhost:5179",  // chatbot client (widget dev server)
  "http://localhost:8080",  // nginx gateway
  // Production origins (read from env)
  process.env.WIDGET_ORIGIN || "https://grow-digitally-chatbot-6tky.vercel.app",
  // Split additional origins from env var
  ...(process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean),
];
```

---

### Step 8 — Start Everything Locally

#### 8a. Start the Main Ecosystem

```bash
# From repo root — starts Python backend + WebSocket server
./start-local.sh
```

#### 8b. Start the Chatbot Server (Docker)

If you added the chatbot to `docker-compose.yml` (Step 3):

```bash
cd backend/python
docker compose up chatbot-server --build -d
```

Or run it standalone (faster for chatbot-only development):

```bash
cd GrowDigitally-Chatbot/server
npm install
npm run dev   # nodemon on :3001
```

#### 8c. Start the Chatbot Widget Dev Server

```bash
cd GrowDigitally-Chatbot/client
npm install
npm run dev -- --port 5179
```

#### 8d. Service Health Check

```
URL                                           Expected Response
──────────────────────────────────────────────────────────────
http://localhost:8080/health                  {"status":"healthy"}   (nginx → Python)
http://localhost:3001/                        <h1>ChatBot Application</h1>
http://localhost:8080/api/chatbot/business/by-token/<token>   JSON from chatbot
http://localhost:5179/                        Chatbot widget UI
```

#### Complete Port Reference

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GrowDigitally Ecosystem — Full Local Dev
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GD Frontends
    AI Website     →  http://localhost:5176
    AI Dashboard   →  http://localhost:5177
    Admin Panel    →  http://localhost:5174
    Org Platform   →  http://localhost:5178
    Chatbot Widget →  http://localhost:5179

  Backend (all via nginx :8080)
    nginx          →  http://localhost:8080
    user-auth      →  http://localhost:8001/docs
    platform       →  http://localhost:8004/docs
    ai             →  http://localhost:8005/docs
    ws-server      →  http://localhost:3000
    chatbot-server →  http://localhost:3001     ★ new

  Data
    PostgreSQL     →  host.docker.internal:55432 (SSM → RDS)
    Redis          →  127.0.0.1:6379
    MongoDB Atlas  →  cloud  (or localhost:27017 if running locally)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 9 — Production Deployment

The chatbot uses Vercel serverless by default (see `vercel.json`). For production integration with the GD ecosystem on AWS, you have two options:

#### Option A — Keep Chatbot on Vercel (Recommended for Speed)

- Chatbot server deployed to Vercel: `https://grow-digitally-chatbot.vercel.app`
- Chatbot client (widget) deployed to Vercel: `https://grow-digitally-chatbot-6tky.vercel.app`
- Update the GD nginx on EC2 to proxy `/api/chatbot/*` to the Vercel URL

In production nginx:
```nginx
upstream chatbot_vercel {
    server grow-digitally-chatbot.vercel.app:443;
    keepalive 16;
}

location /api/chatbot/ {
    rewrite ^/api/chatbot/(.*) /api/$1 break;
    proxy_pass         https://chatbot_vercel;
    proxy_set_header   Host  grow-digitally-chatbot.vercel.app;
    proxy_ssl_server_name on;
    proxy_read_timeout 60s;
}
```

#### Option B — Deploy Chatbot on AWS EC2 (Same Server)

1. SSH into the EC2 instance:
   ```bash
   aws ssm start-session --profile gd-sso --target i-070710e1a20335d46
   ```
2. Pull the latest chatbot code:
   ```bash
   cd /opt/grow-digitally-eco-system/GrowDigitally-Chatbot/server
   git pull
   npm ci --omit=dev
   pm2 restart chatbot-server || pm2 start server.js --name chatbot-server
   ```
3. Add the chatbot nginx block to `/etc/nginx/conf.d/growdigitally.conf`:
   ```nginx
   location /api/chatbot/ {
       rewrite ^/api/chatbot/(.*) /api/$1 break;
       proxy_pass http://localhost:3001;
       # ... standard headers ...
   }
   ```

---

## 5. Cross-Stack Data Sync (Optional Deep Integration)

These optional steps allow richer integration between the chatbot data (MongoDB) and the main platform data (PostgreSQL).

### 5a. Link Chatbot Businesses to GD Users

When a GD user registers a business in the chatbot, store their GD user ID in MongoDB:

In `businessController.js`, use the JWT user from `req.gdUser` (set by `verifyGDToken` middleware):

```js
export const registerBusiness = async (req, res) => {
  const { companyName, ownerName, email, websiteUrl } = req.body;
  const gdUserId = req.gdUser?.userId || null;  // ← from JWT

  const business = await Business.create({
    companyName, ownerName, email, websiteUrl,
    businessId, widgetToken,
    gdUserId,  // ← link to GD user
    knowledgeBaseStatus: "pending",
  });
  // ...
};
```

Add `gdUserId` to the Business Mongoose schema:

```js
gdUserId: {
  type: String,
  index: true,
  default: null,  // null = registered without a GD account
},
```

### 5b. Notify the Python AI Service of New Chatbot Registrations

After a business registers, fire a webhook to the GD AI service (port 8005) to create a corresponding record:

```js
// In businessController.js, after Business.create():
if (process.env.GD_AI_SERVICE_URL) {
  axios.post(`${process.env.GD_AI_SERVICE_URL}/api/v1/internal/chatbot-business`, {
    businessId,
    companyName,
    websiteUrl,
    gdUserId,
  }, {
    headers: { "X-Internal-Secret": process.env.GD_INTERNAL_SECRET }
  }).catch(err => console.error("[Chatbot] Failed to notify AI service:", err.message));
}
```

Add to chatbot `.env`:
```env
GD_AI_SERVICE_URL=http://ai:8005            # Docker internal
GD_INTERNAL_SECRET=<shared_secret>
```

### 5c. Surface Chatbot Stats in the GD Admin Dashboard

The GD Admin panel (`:5174`) can query the chatbot API to display:
- Total registered businesses
- Total conversations
- Total messages

Chatbot exposes these at `/api/chatbot/business/*` (via nginx). The admin frontend simply calls:

```js
const stats = await fetch("http://localhost:8080/api/chatbot/business/stats", {
  headers: { Authorization: `Bearer ${gdToken}` }
});
```

---

## 6. Environment Variable Reference

### Chatbot Server (`GrowDigitally-Chatbot/server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Must be `3001` locally (3000 is taken by ws-server) |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string or local Docker URL |
| `JWT_SECRET` | ✅ | Must match the main ecosystem's `JWT_SECRET` |
| `N8N_CHAT_WEBHOOK_URL` | ✅ | n8n webhook for AI chat responses |
| `N8N_TRAIN_WEBHOOK` | ✅ | n8n webhook for website scraping/training |
| `N8N_CALLBACK_SECRET` | ✅ | Shared secret for n8n → chatbot callbacks |
| `N8N_HOST` | ✅ | n8n hostname (used for CSP headers) |
| `WIDGET_URL` | ✅ | Public URL of the built widget.js |
| `WIDGET_ORIGIN` | ✅ | Origin domain of the widget CDN (CORS + CSP) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated list of allowed CORS origins |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `OPENAI_MODEL` | ✅ | e.g. `gpt-4o-mini` |
| `CRON_SECRET` | optional | For Vercel cron job auth on `/api/business/process-queue` |
| `GD_AI_SERVICE_URL` | optional | For cross-stack notifications (Step 5b) |
| `GD_INTERNAL_SECRET` | optional | Shared secret for internal service calls |

### Chatbot Client (`GrowDigitally-Chatbot/client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_REACT_APP_BACKEND_URL` | ✅ | In dev: `http://localhost:8080/api/chatbot` |
| `N8N_CHAT_WEBHOOK_URL` | optional | Direct n8n URL (not needed if proxied via backend) |

### Frontend Apps (e.g., `frontend/react/apps/ai-dashboard/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_CHATBOT_WIDGET_TOKEN` | optional | Widget token for embedding the chatbot |
| `VITE_CHATBOT_WIDGET_URL` | optional | In dev: `http://localhost:5179/widget.js` |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `CORS: origin not allowed` on chatbot requests | Chatbot `allowedOrigins` missing GD frontend origin | Add the origin to `server.js` and `ALLOWED_ORIGINS` env var |
| Chatbot API returns 404 via nginx | nginx location block missing or wrong order | Ensure `/api/chatbot/` block is before generic `/api/` block |
| `jwt malformed` or `invalid signature` in chatbot | `JWT_SECRET` mismatch | Copy exact `JWT_SECRET` value from `config/.env.rds` to chatbot `.env` |
| Widget not loading (`404 on widget.js`) | Wrong `VITE_CHATBOT_WIDGET_URL` | Check the URL matches where the widget dev server / build is served |
| MongoDB connection refused | Atlas network access not whitelisted | Add your IP to MongoDB Atlas → Network Access → IP Allowlist (or use 0.0.0.0/0 for dev) |
| Chatbot on port 3000 conflicts with ws-server | Default port clash | Set `PORT=3001` in chatbot `.env` |
| `ECONNREFUSED chatbot-server:3001` in nginx | Chatbot container not started or unhealthy | `docker compose up chatbot-server --build -d` and check logs |
| n8n train webhook not firing | `N8N_TRAIN_WEBHOOK` not set | Set the env var; check `/api/chatbot/business/process-queue` endpoint |
| Widget shows stale backend URL | Vite bakes env vars at build time | Rebuild the widget after changing `.env` |
| `knowledgeBaseStatus` stuck at `pending` | Scraping queue not processing | Call `POST /api/chatbot/business/process-queue` with the cron secret header |
| Docker Compose build fails (chatbot) | No `Dockerfile` in `GrowDigitally-Chatbot/server/` | Create the Dockerfile from Step 3c |

---

## Quick Reference Commands

```bash
# ── Chatbot Server (standalone) ──────────────────────────────────
cd GrowDigitally-Chatbot/server && npm run dev

# ── Chatbot Widget (dev server) ──────────────────────────────────
cd GrowDigitally-Chatbot/client && npm run dev -- --port 5179

# ── Build widget for production ──────────────────────────────────
cd GrowDigitally-Chatbot/client && npm run build

# ── Start chatbot Docker container only ──────────────────────────
cd backend/python && docker compose up chatbot-server --build -d

# ── View chatbot logs ─────────────────────────────────────────────
docker logs -f gd_chatbot_local

# ── Register a test business ─────────────────────────────────────
curl -X POST http://localhost:8080/api/chatbot/business/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test Co","ownerName":"Jane","email":"jane@test.com","websiteUrl":"https://test.com"}'

# ── Send a test chat message ─────────────────────────────────────
curl -X POST http://localhost:8080/api/chatbot/chat/message \
  -H "Content-Type: application/json" \
  -H "x-widget-token: <your_widget_token>" \
  -d '{"message":"Hello!","sessionId":"test_session_001","businessId":"biz_xxx"}'

# ── Process scraping queue manually ──────────────────────────────
curl -X POST http://localhost:3001/api/business/process-queue \
  -H "x-n8n-secret: <your_n8n_callback_secret>"
```

---

*Last updated: June 2026 — Covers `GrowDigitally-Chatbot` integration into `grow-digitally-eco-system` v2.1*
