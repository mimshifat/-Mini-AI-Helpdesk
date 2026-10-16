# Mini AI Helpdesk

A clean, modern, and reliable Full-Stack Support & Ticket Management system with built-in AI Copilot triage capabilities. Built with **React 19**, **Tailwind CSS**, **Axios**, **Django REST Framework (DRF)**, **SimpleJWT**, and **PostgreSQL** (with cloud `DATABASE_URL` support for Neon, Supabase, Render, etc.).

---

## 📸 Key Features

- **🛡️ JWT Authentication & Role-Based Access Control (RBAC)**:
  - **Short-Lived Access Tokens (15 min)** for stateless, high-performance API authentication (`Bearer <token>`).
  - **Long-Lived Refresh Tokens (7 days)** with automatic rotation and database-level blacklisting on logout.
  - **Silent Concurrency-Safe Refresh**: Frontend Axios interceptor automatically intercepts `401 Unauthorized`, locks concurrent requests, obtains a fresh access token, and retries the original request seamlessly.
  - **Standard Users**: Create tickets, review personal inquiries, view scoped analytics, and update personal tickets.
  - **Admins**: System-wide ticket access, global metrics, one-click ticket lifecycle triage (`Open` → `In Progress` → `Resolved`), and deletion rights.
- **✨ Two-Sided AI Ticket Copilot**:
  - **Inbound Triage (User-Facing)**: Analyzes ticket subject & description to suggest optimal Category (`Technical`, `Billing`, `General`) and SLA Priority (`Low`, `Medium`, `High`) with a concise synopsis.
  - **Resolution Assist (Agent-Facing)**: Detects customer sentiment (`Frustrated`, `Neutral`, `Positive`), outlines a 3-step technical action plan, and drafts customer response with 1-click clipboard copy.
  - **Graceful Offline Fallback**: If an AI provider API key is not configured or times out, the system fails gracefully with non-blocking user guidance, allowing manual ticket processing without interruption.
- **📊 Real-Time Analytics Dashboard**:
  - Visual KPI cards for Total, Open, In Progress, and Resolved tickets.
  - Recent activity ticket queue with instant status badges.
- **🔍 Advanced Search, Multi-Field Filtering & Pagination**:
  - Debounced search across ticket titles and descriptions.
  - Filter by Status, Priority, and Category simultaneously.
  - Server-side pagination (10 items per page) with boundary navigation.
- **🎨 Modern Glassmorphic Design System**:
  - Custom brand color palette, Google Font (*Plus Jakarta Sans*), micro-animations, accessible labels, loading skeletons, responsive mobile navigation drawer, and animated status badges.
- **⚡ Quick Demo Fill**:
  - Instant one-click credentials auto-fill on the login screen for testing both `admin_demo` and `user_demo`.

---

## 🏗️ Architecture & Technology Stack

```
mini-ai-helpdesk/
├── backend/                  # Django REST Framework Backend
│   ├── core/                 # Django settings, JWT configuration & root URL router
│   ├── accounts/             # Custom User model, JWT views (login, refresh, logout, me) & test suite
│   ├── tickets/              # Ticket CRUD, filters, permissions & pagination
│   ├── dashboard/            # Aggregated statistics API
│   ├── ai_assistant/         # Server-side AI triage and resolution service layer
│   ├── requirements.txt      # Pinned Python dependencies (including SimpleJWT, dj-database-url)
│   ├── .env.example          # Environment variable template (DATABASE_URL & DB credentials)
│   └── manage.py
│
├── frontend/                 # React 19 + Vite Application
│   ├── src/
│   │   ├── config/           # Centralized configuration (api.js with Axios instance creation)
│   │   ├── api/              # HTTP client with JWT interceptor, silent refresh mutex & domain services
│   │   │   ├── client.js     # Axios instance re-export, Bearer token injection, 401 retry interceptor
│   │   │   ├── auth.js       # Authentication endpoints (login, logout, refreshToken, getMe)
│   │   │   ├── tickets.js    # Tickets CRUD with native { params } query serialization
│   │   │   ├── dashboard.js  # Dashboard metrics endpoint
│   │   │   └── ai.js         # AI triage and resolution endpoints
│   │   ├── providers/        # Clean composition root (AppProviders, AuthProvider)
│   │   ├── routes/           # Declarative routing configuration (Route.jsx, PrivateRoutes.jsx)
│   │   ├── hooks/            # Custom hooks (useAuth, useTickets, useTicketDetail, useCreateTicket, useDashboard, useAICopilot, useDebounce)
│   │   ├── components/       # Component-driven modular architecture
│   │   │   ├── common/       # Atoms: Button, Card, Input, Textarea, Select, Badge, Modal, Skeleton
│   │   │   ├── layout/       # AppLayout, Sidebar, Header, Mobile Drawer
│   │   │   ├── dashboard/    # StatCard, RecentTicketsTable, AiFeatureBanner
│   │   │   └── tickets/      # TicketTable, TicketFilters, TicketPagination, TicketForm, TicketAiTriageCard, etc.
│   │   ├── context/          # Central pure React Context definitions (AuthContext)
│   │   ├── pages/            # Thin page orchestrators (LoginPage, DashboardPage, TicketListPage, TicketCreatePage, TicketDetailPage)
│   │   ├── App.jsx           # Clean root composition (<AppProviders><RouteConfig /></AppProviders>)
│   │   └── main.jsx
│   ├── tailwind.config.js    # Custom brand tokens, fonts, and animations
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example          # Frontend environment template
│
├── .gitignore                # Comprehensive exclusions (venv, node_modules, .env, logs)
└── README.md
```

### Stack Components:
- **Frontend**: React 19, Vite, Axios, Tailwind CSS v3, React Router v7, Lucide Icons
- **Backend**: Python 3.12+, Django 6.x, Django REST Framework, Django SimpleJWT (with Token Blacklist), Django CORS Headers, Python-Dotenv, Psycopg2-binary, dj-database-url
- **Database**: PostgreSQL (supports cloud `DATABASE_URL` for Neon, Supabase, Render, or local PostgreSQL credentials)
- **AI Integration**: OpenAI-compatible REST API client with timeout protection and schema validation

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ or v24+) & **npm**
- **Python** (v3.10+)
- **Git**

---

### 1. Backend Setup

1. Open a terminal in the project root and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install pinned dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create and configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and configure your database connection:
   - **Option A: Remote Cloud Database (Recommended for Neon, Supabase, Render, Heroku)**:
     ```env
     DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
     ```
   - **Option B: Local PostgreSQL**:
     ```env
     DB_NAME=helpdesk_db
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=5432
     ```
   *(Optional: Add your free Google Gemini API key or OpenAI key in `backend/.env` to enable live AI triage & resolution).*

5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

6. Seed initial demo users and tickets:
   ```bash
   python manage.py seed_demo_data
   ```
   *This command creates the `admin_demo` and `user_demo` accounts and generates 5 realistic support tickets.*

7. Start the Django development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   Backend will be running at `http://127.0.0.1:8000/`.

---

### 2. Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure frontend environment file exists:
   ```bash
   cp .env.example .env
   ```
   *Default: `VITE_API_URL=http://127.0.0.1:8000/api`*

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at `http://localhost:5173/`.

---

## 👥 Demo Credentials

| Role | Username | Password | Scope / Permissions |
|---|---|---|---|
| **System Administrator** | `admin_demo` | `Admin@1234` | Full access: View all tickets, update lifecycle status, delete any ticket, system-wide metrics |
| **Standard User** | `user_demo` | `User@1234` | Scoped access: View and edit own tickets, scoped metrics, AI-assisted ticket creation |

*(Both accounts can be loaded automatically via the one-click demo buttons on the `/login` page).*

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new user account (`username`, `email`, `password`) | No |
| `POST` | `/api/auth/login/` | Authenticate user & return `{access, refresh, user}` | No |
| `POST` | `/api/auth/token/refresh/` | Obtain fresh access token using refresh token (with token rotation) | No |
| `POST` | `/api/auth/logout/` | Invalidate & blacklist refresh token on server | Yes |
| `GET` | `/api/auth/me/` | Fetch authenticated user profile and role | Yes |

### Tickets (`/api/tickets/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/tickets/` | List tickets (filtered, searched, paginated 10/page) | Yes |
| `POST` | `/api/tickets/` | Create a new ticket (creator assigned to current user) | Yes |
| `GET` | `/api/tickets/{id}/` | Retrieve full ticket details (scoped: owner or admin) | Yes |
| `PATCH` | `/api/tickets/{id}/` | Update ticket fields (status modifiable by admin) | Yes |
| `DELETE` | `/api/tickets/{id}/` | Delete ticket (owner or admin only) | Yes |

### Dashboard Analytics (`/api/dashboard/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/stats/` | Returns `{total, open, in_progress, resolved}` counts | Yes |

### AI Assistant (`/api/ai/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/ai/suggest/` | Request AI category, priority, and summary recommendations | Yes |
| `POST` | `/api/ai/draft-resolution/` | Request agent-assist package (sentiment, action plan, draft reply) | Yes |

---

## 🔐 Token Security & Axios Architecture

### 1. Token Lifespan & Rotation
- **Access Token:** Short-lived (15 minutes), passed as `Authorization: Bearer <access_token>`.
- **Refresh Token:** Long-lived (7 days), passed to `/api/auth/token/refresh/`.
- **Rotation & Blacklisting:** Configured with `ROTATE_REFRESH_TOKENS = True` and `BLACKLIST_AFTER_ROTATION = True`. Every refresh call blacklists the consumed refresh token and issues a new pair, preventing token replay attacks.

### 2. Frontend Concurrency Lock (Mutex)
When multiple API requests trigger simultaneously on an expired access token:
- The Axios response interceptor holds downstream requests using a shared `refreshPromise`.
- Exactly one refresh request is dispatched to `/api/auth/token/refresh/`.
- Upon successful refresh, all queued requests are automatically retried with the new access token.
- If refresh fails (e.g., refresh token expired), all tokens are purged and a `helpdesk:auth-expired` event redirects to `/login`.

---

## 🤖 AI Copilot Specification & Evaluation

The system implements a **Two-Sided AI Architecture** addressing both sides of the support lifecycle:
1. **Inbound Triage (User-Facing)**: Solves misclassification and dispatch overhead upon ticket creation.
2. **Resolution Copilot (Agent-Facing)**: Solves Mean Time to Resolution (MTTR) by diagnosing sentiment, building troubleshooting steps, and drafting customer communications.

### 1. Inputs & Contracts
- **Triage Endpoint (`/api/ai/suggest/`)**:
  - `title` (string, max 500 chars)
  - `description` (string, max 5,000 chars)
- **Resolution Copilot Endpoint (`/api/ai/draft-resolution/`)**:
  - `title` (string, max 500 chars)
  - `description` (string, max 5,000 chars)
  - `category` (string, optional: `Technical`, `Billing`, `General`)

*Security Guard:* Both endpoints enforce strict view-layer length boundaries to prevent prompt inflation or resource exhaustion.

### 2. Output Schemas

**Triage Contract (`/api/ai/suggest/`)**:
```json
{
  "category": "Technical | Billing | General",
  "priority": "Low | Medium | High",
  "summary": "Concise 1-sentence synopsis (max 200 characters)"
}
```

**Resolution Assist Contract (`/api/ai/draft-resolution/`)**:
```json
{
  "sentiment": "Frustrated | Neutral | Positive",
  "internal_action_steps": [
    "Verify user permissions in the database",
    "Inspect application logs for 401/403 events",
    "Issue credentials reset email"
  ],
  "draft_customer_reply": "Dear User, thank you for contacting support..."
}
```

---

## 🧪 Testing & Validation

### Backend Automated Test Suite
The project includes a comprehensive Django test suite with **70 automated tests (100% pass rate)** covering all 4 core apps:
- **`accounts` (15 tests)**: JWT login, access/refresh token generation, token refresh rotation, logout blacklisting, and invalid credential handling.
- **`tickets` (30 tests)**: Full CRUD operations, object-level permission enforcement (regular users cannot access other users' tickets → `404 Not Found`), customer statement integrity policy (admins cannot tamper with customer's original title/description), role-based field updates (status change restricted to admins), search, multi-param filtering, and pagination.
- **`dashboard` (5 tests)**: Scoped metric aggregation (admin system-wide vs. standard user personal ticket counts) and zero-state handling.
- **`ai_assistant` (20 tests)**: Mocked external LLM tests covering happy paths, role-restricted resolution access (403 for non-admins), timeout handling, missing credentials, rate limit errors, and schema deviation guards.

Run all tests:
```bash
cd backend
python manage.py test accounts tickets dashboard ai_assistant --keepdb
```

### Frontend Production Build & Linting:
Verify zero lint warnings and successful production bundling:
```bash
cd frontend
npm run lint
npm run build
```

---

## 🔒 Security & Best Practices
- **No secrets in git**: `.env` files and logs are explicitly excluded via `.gitignore`.
- **Database Connection Flexibility & Reliability**: Seamless support for managed cloud PostgreSQL providers (`DATABASE_URL`) with connection pooling (`conn_max_age=60`), active health checks (`conn_health_checks=True`), and SSL enforcement, alongside traditional local credentials.
- **Customer Statement Integrity (Audit Policy)**: In line with real-world enterprise compliance (e.g. Zendesk/Freshdesk), a customer's reported complaint is an immutable record of fact. Admins can triage operational metadata (`Category`, `Priority`, `Status`), but are strictly barred at both the frontend and backend serializer level from altering the customer's original `Title` and `Description`.
- **Cross-Origin Resource Sharing (CORS)**: Configured specifically for trusted frontend origins.
- **Object-Level Permissions**: Regular users receive `404 Not Found` when requesting tickets outside their ownership to avoid data enumeration.
- **Fail-Safe AI**: AI calls are wrapped in service-level timeouts and structured fallback handlers, ensuring the application remains 100% operational regardless of third-party API availability.
