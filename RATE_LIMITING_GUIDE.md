# Rate Limiting Implementation
**Status:** ✅ IMPLEMENTED & LIVE

## Overview

Rate limiting has been implemented using **slowapi**, protecting the API from brute-force attacks, DoS attempts, and abuse.

## Current Limits

### Authentication Endpoints (Strict)
- **`POST /api/auth/login`** → 5 requests per minute
- **`POST /api/auth/register`** → 3 requests per minute  
- **`POST /api/auth/refresh`** → 10 requests per minute

### WhatsApp Webhooks
- **`POST /api/whatsapp/webhook`** → 30 requests per minute (allows Meta retries)
- **`POST /api/whatsapp/simulate`** → 5 requests per minute

### General API
- All other endpoints → 100 requests per minute (default)

### Search Endpoints
- Reserved for future use → 20 requests per minute

## How It Works

1. **IP-based tracking** — Rate limits are keyed by client IP address
2. **In-memory storage** — Limits stored in application memory (Redis-backed in production)
3. **HTTP 429 response** — Returns `Too many requests` when limit exceeded
4. **Configurable** — Edit limits in `backend/core/rate_limit.py`

## Configuration

**File:** `backend/core/rate_limit.py`

```python
LIMITS = {
    "auth_login": "5/minute",
    "auth_register": "3/minute",
    "auth_refresh": "10/minute",
    "whatsapp_webhook": "30/minute",
    "whatsapp_simulate": "5/minute",
    "general": "100/minute",
    "search": "20/minute",
}
```

## Testing Rate Limits

```bash
# Test login rate limit (will pass 5 times, fail on 6th in a minute)
for i in {1..7}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    --max-time 5
  sleep 2
done

# Last request should return HTTP 429 with:
# {"detail": "Too many requests. Please try again later."}
```

## Production Deployment

For production, update rate limiting to use **Redis** for distributed rate limiting across multiple backend instances:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379/1",
    strategy="fixed-window"
)
```

## Monitoring

Rate limit rejections are logged:
```
WARNING:     Rate limit exceeded for 192.168.1.100
```

Monitor these logs to detect:
- Brute-force attacks on `/auth/login`
- DoS attempts on webhooks
- Legitimate users hitting limits (may need adjustment)

## Adjusting Limits

To tighten security further (recommended):
```python
LIMITS = {
    "auth_login": "3/minute",      # More aggressive
    "auth_register": "1/minute",   # Prevent sign-up spam
    "auth_refresh": "5/minute",    # Stricter token refresh
    "whatsapp_webhook": "60/minute", # Allow burst for Meta webhooks
}
```

## Architecture

```
Request → IP address → Rate limit check
          ↓
      LIMITS dict (in-memory)
          ↓
    Under limit? → HTTP 200 (proceed)
    Over limit?  → HTTP 429 (reject)
```

## Files Modified

- `backend/core/rate_limit.py` — New rate limiting module
- `backend/pyproject.toml` — Added slowapi dependency
- `backend/main.py` — Registered rate limiter & exception handler
- `backend/features/auth/router.py` — Applied limits to auth endpoints
- `backend/features/whatsapp/router.py` — Applied limits to webhook endpoints

## Next Steps

1. **Monitor in beta** — Watch logs for legitimate rate limit hits
2. **Adjust if needed** — Fine-tune limits based on actual usage patterns
3. **Deploy to production** — Switch to Redis-backed rate limiting
4. **Add monitoring** — Track HTTP 429 responses in your observability platform

---

**Status:** Rate limiting is now active and protecting your API. ✅
