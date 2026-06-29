from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded

from core.config import settings
from core.database import init_db
from core.rate_limit import limiter, rate_limit_error_handler
from features.auth.router import router as auth_router
from features.contacts.router import router as contacts_router
from features.conversations.router import router as conversations_router
from features.messages.router import router as messages_router
from features.whatsapp.router import router as whatsapp_router
from features.email.router import router as email_router
from features.pipeline.router import router as pipeline_router
from features.broadcasts.router import router as broadcasts_router
from features.automations.router import router as automations_router
from features.catalog.router import router as catalog_router
from features.analytics.router import router as analytics_router
from features.team.router import router as team_router
from features.api_keys.router import router as api_keys_router
from features.bot_config.router import router as bot_config_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Medha Sync API",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_error_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(contacts_router, prefix="/api/contacts", tags=["contacts"])
app.include_router(conversations_router, prefix="/api/conversations", tags=["conversations"])
app.include_router(messages_router, prefix="/api/messages", tags=["messages"])
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["whatsapp"])
app.include_router(email_router, prefix="/api/email", tags=["email"])
app.include_router(pipeline_router, prefix="/api/pipeline", tags=["pipeline"])
app.include_router(broadcasts_router, prefix="/api/broadcasts", tags=["broadcasts"])
app.include_router(automations_router, prefix="/api/automations", tags=["automations"])
app.include_router(catalog_router, prefix="/api/catalog", tags=["catalog"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(team_router, prefix="/api/team", tags=["team"])
app.include_router(api_keys_router, prefix="/api/api-keys", tags=["api-keys"])
app.include_router(bot_config_router, prefix="/api/bot/config", tags=["bot_config"])


@app.get("/health")
async def health():
    return {"status": "ok"}
