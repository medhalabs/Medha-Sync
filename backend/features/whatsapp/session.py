import json
from core.redis_client import get_redis

SESSION_TTL = 1800  # 30 minutes


async def get_session(phone: str) -> dict:
    redis = await get_redis()
    data = await redis.get(f"wa_session:{phone}")
    return json.loads(data) if data else {}


async def set_session(phone: str, session: dict) -> None:
    redis = await get_redis()
    await redis.setex(f"wa_session:{phone}", SESSION_TTL, json.dumps(session))


async def clear_session(phone: str) -> None:
    redis = await get_redis()
    await redis.delete(f"wa_session:{phone}")
