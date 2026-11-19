# CareerPilot AI — Production Deployment Guide

This guide covers production deployment strategies for **CareerPilot AI**, ranging from zero-maintenance free cloud platforms to single-server VPS and enterprise container environments.

---

## 🏗️ Architecture Overview for Production

```mermaid
flowchart LR
    subgraph Users["End Users"]
        Browser["Web Browser"]
    end

    subgraph CDN["Edge CDN / Reverse Proxy"]
        Vercel["Vercel (Next.js Frontend)"]
        SSL["Nginx / Caddy (SSL & CORS)"]
    end

    subgraph Compute["Application Servers"]
        FastAPI["FastAPI Backend (Docker / Render / Railway)"]
    end

    subgraph Data["Managed Database Layer"]
        PG[("PostgreSQL 16 + pgvector (Supabase / Neon / Render)")]
    end

    Browser --> Vercel
    Vercel -->|API Requests| FastAPI
    Browser -->|Direct Web App| Vercel
    FastAPI -->|Vector Queries & CRUD| PG
```

---

## 🌟 Strategy 1: Modern Cloud Deployment (Recommended for Portfolios)

This is the standard modern stack: **Zero infrastructure management**, free tiers, and 99.9% uptime.

### Overview
| Component | Platform | Free Tier / Cost |
| :--- | :--- | :--- |
| **Database (PostgreSQL + pgvector)** | **Supabase** or **Neon.tech** | Free ($0/mo with pre-installed pgvector) |
| **Backend API (FastAPI)** | **Render** or **Railway** | Free / $5/mo |
| **Frontend (Next.js)** | **Vercel** | Free ($0/mo) |

---

### Step 1: Deploy PostgreSQL + pgvector on Supabase (2 mins)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the project dashboard, navigate to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Go to **Project Settings** -> **Database** -> **Connection string** (URI).
4. Copy the URI string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`).

---

### Step 2: Deploy Backend to Render or Railway

#### Using Render (render.com):
1. Push your repository to GitHub (`git push origin master`).
2. Log in to [render.com](https://render.com) -> Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, add:
   ```env
   ENVIRONMENT=production
   PROJECT_NAME=CareerPilot AI
   SECRET_KEY=generate_a_secure_random_64_character_hex_string
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   VECTOR_DIMENSION=384
   GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```
6. Click **Deploy Web Service**.
7. Copy your backend URL (e.g., `https://careerpilot-api.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com) -> Click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. Configure settings:
   - **Root Directory:** Select `frontend` (Click *Edit* and choose `frontend`).
   - **Framework Preset:** `Next.js` (automatically detected).
4. Add **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://careerpilot-api.onrender.com/api/v1
   ```
5. Click **Deploy**.
6. In ~60 seconds, your site is live with global CDN and automated SSL (e.g., `https://careerpilot-ai.vercel.app`).
7. Update `FRONTEND_URL` on Render with your actual Vercel domain to finalize CORS security.

---

## 🐳 Strategy 2: Single-Server VPS Deployment (Docker Compose)

Deploy the entire self-contained stack on a cloud VPS (**DigitalOcean Droplet**, **AWS EC2**, **Hetzner**, or **Linode**).

### Minimum VPS Sizing:
- **CPU:** 2 vCPU
- **RAM:** 2 GB+ (4 GB recommended)
- **Disk:** 25 GB SSD
- **OS:** Ubuntu 22.04 LTS / 24.04 LTS

---

### Step-by-Step Server Setup

#### 1. Connect to VPS via SSH:
```bash
ssh root@your_server_ip
```

#### 2. Install Docker & Docker Compose:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Enable Docker service
sudo systemctl enable --now docker
```

#### 3. Clone Repository:
```bash
git clone https://github.com/your-username/CareerPilot_AI.git
cd CareerPilot_AI
```

#### 4. Configure Production Environment:
Create `.env` file on the server:
```bash
cp .env.example .env
nano .env
```
Update with secure values:
```env
ENVIRONMENT=production
PROJECT_NAME="CareerPilot AI"
SECRET_KEY=super_secure_random_string_2026_production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/careerpilot
VECTOR_DIMENSION=384
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://yourdomain.com
```

#### 5. Launch Containers with Docker Compose:
```bash
docker compose up -d --build
```

Check status:
```bash
docker compose ps
```
All 3 containers (`careerpilot_postgres`, `careerpilot_backend`, `careerpilot_frontend`) will report `Up (healthy)`.

---

### Step 6: Setup Caddy Reverse Proxy for Free HTTPS / SSL

Install **Caddy** (simplest automated SSL reverse proxy in the world):

```bash
# Install Caddy on Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy -y
```

Configure `/etc/caddy/Caddyfile`:
```bash
sudo nano /etc/caddy/Caddyfile
```

Add your domain configuration:
```caddy
yourdomain.com {
    # Reverse proxy frontend
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    # Reverse proxy backend API
    reverse_proxy localhost:8000
}
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```
> Caddy automatically provisions and renews Let's Encrypt SSL certificates for both domains with zero manual configuration.

---

## 🔒 Production Security Checklist

- [ ] **Secret Keys:** Generate a cryptographically strong `SECRET_KEY`:
  ```python
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- [ ] **CORS Configuration:** In `backend/app/core/config.py` and environment, set `FRONTEND_URL` strictly to your production frontend domain (disable `*` wildcard origin).
- [ ] **Database Passwords:** Never use default passwords (`postgres`/`postgres`) in public production environments.
- [ ] **Rate Limiting:** Place Cloudflare or Nginx in front of auth endpoints (`/auth/login`, `/auth/register`) to prevent brute-force attacks.
- [ ] **SSL / HTTPS:** Ensure all traffic uses TLS 1.3.

---

## 🔍 Verification & Healthchecks After Deployment

Test API health:
```bash
curl -I https://api.yourdomain.com/health
# Expected: HTTP/2 200 OK
# Response: {"status":"healthy","database":"connected"}
```

Test OpenAPI docs:
Navigate to `https://api.yourdomain.com/docs` in your browser.
