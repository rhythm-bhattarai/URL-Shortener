# URL Shortener with Analytics

A full-stack web application that shortens URLs and tracks click analytics, built with Django REST Framework and TypeScript.

---

## Prerequisites

### To run with Docker (recommended)
- Docker
- Docker Compose

### To run manually
- Python 3.10+
- Node.js 18+
- Redis
- PostgreSQL

---

## Running the App

### Option 1 — Docker (recommended)

This is the easiest way to run the full stack. One command starts all four services (PostgreSQL, Redis, Django backend, Vite frontend) with no manual setup required.

```bash
git clone <your-repo-url>
cd URL-Shortener

docker compose up --build
```

On subsequent runs, the `--build` flag is optional:

```bash
docker compose up
```

To stop all containers:

```bash
docker compose down
```

Once running, the services are available at:

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |

Database migrations run automatically on container startup — no manual steps needed.

---

### Option 2 — Manual setup

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd URL-Shortener
```

#### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python core/manage.py migrate

# Start Redis (required for rate limiting)
brew services start redis       # macOS
sudo service redis-server start # Ubuntu/Debian

# Start the development server
python core/manage.py runserver
```

The backend will be available at `http://localhost:8000`.

#### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

When running manually, create a `.env` file inside the `/frontend` folder:

```env
VITE_API_BASE_URL = 'http://127.0.0.1:8000' or '<your-base-backend-url>'
```

When running with Docker, environment variables are already configured in `docker-compose.yml` and no `.env` file is needed.

---

## How the Rate Limiter Works

### Overview

The rate limiter is implemented as a custom Django middleware class (`RateLimitMiddleware`) in `backend/shortener/middleware.py`. It uses a **Fixed Window** algorithm backed by Redis and allows a maximum of **5 POST requests to `/api/shorten/` per IP address per minute**.

Only the URL shortening endpoint is rate limited. The analytics and redirect endpoints are unrestricted.

---

### Algorithm — Fixed Window

Time is divided into fixed 1-minute buckets. Each bucket is tracked in Redis using a key in the format:

```
rl:{ip_address}:{YYYYMMDDHHMM}
```

For example, a request from `192.168.1.1` at `10:04:37` produces the key:

```
rl:192.168.1.1:202505171004
```

When the minute changes, the key changes automatically — a new window begins with a fresh count.

---

### Step-by-step request flow

When a `POST /api/shorten/` request arrives, the middleware executes before the request reaches the view:

**Step 1 — Extract client IP**

```python
ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
if ip_address:
    ip_address = ip_address.split(',')[0].strip()
else:
    ip_address = request.META.get('REMOTE_ADDR')
```

`HTTP_X_FORWARDED_FOR` is checked first to handle requests coming through a proxy or Docker network, where `REMOTE_ADDR` would return the proxy's IP instead of the real client. If the header contains multiple IPs (e.g. `client, proxy1, proxy2`), only the first one — the original client — is used.

**Step 2 — Build the Redis key**

```python
current_minute = time.strftime('%Y%m%d%H%M', time.gmtime())
redis_key = f"rl:{ip_address}:{current_minute}"
```

UTC time is used to avoid timezone inconsistencies across environments.

**Step 3 — Atomically increment the counter**

```python
try:
    current_count = cache.incr(redis_key)
except ValueError:
    cache.set(redis_key, 1, timeout=60)
    current_count = 1
```

`cache.incr()` atomically increments the counter in Redis. If the key does not exist yet (first request in the window), a `ValueError` is raised — the key is then initialised to `1` with a 60-second TTL. Redis automatically deletes the key when the TTL expires, so no manual cleanup is needed.

**Step 4 — Allow or reject**

```python
if current_count > self.RATE_LIMIT:
    seconds_remaining = 60 - int(time.time() % 60)
    return JsonResponse(
        {
            "error": "Rate limit exceeded",
            "retry_after_seconds": seconds_remaining
        },
        status=429
    )
```

If the count exceeds 5, the middleware immediately returns a `429 Too Many Requests` response. The request never reaches the view. The response body tells the client exactly how many seconds to wait before retrying.

If the count is within the limit, the request passes through to the view as normal:

```python
response = self.get_response(request)
return response
```

---

### Why Redis over a database table

Using Redis `cache.incr()` is **atomic** — two simultaneous requests from the same IP cannot both read a zero count and both believe they are the first request in the window. A database-based approach would require explicit row locking to avoid this race condition.

Redis also expires keys automatically via its TTL mechanism, so there is no need for a scheduled cleanup job or a cron task to purge stale records.

---

### Known limitation — boundary burst

Because windows are fixed and independent, a client can send 5 requests at `10:00:59` and 5 more at `10:01:01` — technically 10 requests within 2 seconds, with both windows allowing them. A sliding window algorithm would prevent this by counting requests within a rolling 60-second window relative to the current moment. The fixed window approach is sufficient for this use case and significantly simpler to implement and reason about.

---

## Project Structure

```
URL-Shortener/
├── backend/
│   ├── core/               # Django project config (settings, root urls, manage.py)
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── manage.py
│   ├── shortener/          # Main app
│   │   ├── middleware.py   # Custom rate limiter
│   │   ├── models.py       # URL, Click models
│   │   ├── serializers.py
│   │   ├── services.py     # URL alias generation logic
│   │   ├── views.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # urlShortener.ts, analytics.ts
│   │   ├── services/       # api.ts
│   │   ├── types/          # index.ts
│   │   └── main.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```