## 🧱 Critvue Tech Stack Overview

A robust, scalable foundation for building a hybrid AI-human feedback SaaS product.

---

### ⚙️ Core Stack

**Frontend:**
- **Next.js 14 (App Router)** — React-based, optimized for performance and scalability
- **Tailwind CSS** — Utility-first styling, ideal for crafting a minimal but expressive UI
- **shadcn/ui** — Clean, accessible component primitives to move fast
- **Framer Motion** — Smooth micro-interactions (fade/slide/load-in)

**Backend:**
- **FastAPI** — Async Python API server, integrates easily with AI workflows and background tasks
- **PostgreSQL** — Reliable relational DB, flexible schema for reviewer/user/feedback models
- **Supabase or Railway** — DB + Auth hosting with serverless options
- **Redis or RQ** — For background tasks: AI review jobs, email notifications, reviewer dispatch

**AI Layer:**
- **OpenAI GPT-4-Turbo (128k)** — Primary AI feedback engine (multi-modal optional)
- **Anthropic Claude 2.1/3** — Fallback for broader context / tone sensitivity
- **LangChain (optional)** — Feedback pipeline orchestration or prompt chaining

**Auth & User Management:**
- **Clerk** — Social login, user dashboard, subscriptions, impersonation (for admin/moderation)
- **Supabase Auth** — Alternative with lighter footprint

**Payments:**
- **Stripe** — Subscriptions (Pro, Premium) + credit packs + Stripe Connect for reviewer payouts

**File Handling:**
- **UploadThing** or **Cloudinary** — Secure file upload, auto-optimize images/media
- **Supabase Buckets** — For direct user file storage

**PDF & Reporting:**
- **WeasyPrint** (Python-based HTML to PDF)
- **react-pdf** — For browser-based export preview

**Notifications:**
- **Resend / Postmark** — Transactional email for feedback alerts, receipts, reviewer assignments

**Hosting:**
- **Vercel** (frontend) + **Render** or **Railway** (backend)
- **Docker** (optional) for team-scale local dev or deploy

**Monitoring & DevOps:**
- **Sentry** — Error monitoring
- **Upstash** — Lightweight Redis for queues or rate limits
- **Planetscale** — Optional managed SQL DB if Supabase isn't ideal

---

### 🔧 Engineering Priorities
- Modular separation of AI logic vs human review logic
- Asynchronous jobs and email notifications built-in from day 1
- Protect feedback integrity: rate review quality, audit reviewer reliability
- Create structured prompts and allow prompt templating for different categories (art, writing, UI, etc.)
