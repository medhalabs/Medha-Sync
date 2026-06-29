"""Rate limiting configuration for API endpoints."""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException, status
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",
)


async def rate_limit_error_handler(request: Request, exc: RateLimitExceeded) -> HTTPException:
    """Handle rate limit exceeded errors."""
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)}")
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please try again later.",
    )


# Rate limit definitions for different endpoint categories
LIMITS = {
    # Authentication endpoints — very strict
    "auth_login": "5/minute",
    "auth_register": "3/minute",
    "auth_refresh": "10/minute",

    # WhatsApp webhooks — moderate (Meta will retry)
    "whatsapp_webhook": "30/minute",
    "whatsapp_simulate": "5/minute",

    # General API — standard
    "general": "100/minute",

    # Search/filter — lighter (can be expensive)
    "search": "20/minute",
}
