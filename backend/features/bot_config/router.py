from fastapi import APIRouter, Depends
from pydantic import BaseModel
from core.security import get_current_user_id
from core.redis_client import get_redis
import json

router = APIRouter()


class BotConfig(BaseModel):
    trigger_keyword: str = ""
    welcome_message: str = "Thanks for reaching out! Our team will be in touch with you shortly."
    menu_header: str = "*Welcome!* 👋"


@router.get("", response_model=BotConfig)
async def get_bot_config(_: str = Depends(get_current_user_id)):
    redis = await get_redis()
    val = await redis.get("bot:config")
    if val:
        return BotConfig(**json.loads(val))
    return BotConfig()


@router.put("", response_model=BotConfig)
async def update_bot_config(data: BotConfig, _: str = Depends(get_current_user_id)):
    redis = await get_redis()
    await redis.set("bot:config", json.dumps(data.model_dump()))
    return data
