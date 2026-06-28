from fastapi import APIRouter, Request, Query, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.config import settings
from features.whatsapp.bot_engine import handle_inbound

router = APIRouter()


@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.META_WEBHOOK_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    try:
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        for msg in messages:
            phone = msg.get("from")
            msg_id = msg.get("id")
            if msg.get("type") == "text":
                text = msg["text"]["body"]
            elif msg.get("type") == "interactive":
                interactive = msg.get("interactive", {})
                if interactive.get("type") == "list_reply":
                    text = interactive["list_reply"]["id"]
                elif interactive.get("type") == "button_reply":
                    text = interactive["button_reply"]["id"]
                else:
                    text = ""
            else:
                text = ""
            if phone and text:
                await handle_inbound(db, phone, text, msg_id)
    except Exception:
        pass
    return {"status": "ok"}


@router.post("/inbound")
async def inbound_from_baileys(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        body = await request.json()
        phone = body.get("phone")
        text = body.get("text", "")
        msg_id = body.get("messageId")
        if phone and text:
            await handle_inbound(db, phone, text, msg_id)
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Unhandled error in inbound handler")
    return {"status": "ok"}


@router.get("/qr")
async def get_qr_code():
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.BAILEYS_SERVICE_URL}/qr")
        return resp.json()


@router.post("/simulate")
async def simulate_inbound(request: Request, db: AsyncSession = Depends(get_db)):
    """Simulate an inbound message for testing — bypasses Baileys."""
    body = await request.json()
    phone = body.get("phone", "").strip()
    text = body.get("text", "").strip()
    if not phone or not text:
        raise HTTPException(status_code=400, detail="phone and text are required")
    import uuid
    await handle_inbound(db, phone, text, f"sim-{uuid.uuid4().hex[:8]}")
    return {"status": "ok", "phone": phone, "text": text}


@router.post("/disconnect")
async def disconnect_whatsapp():
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{settings.BAILEYS_SERVICE_URL}/disconnect", timeout=10)
        return resp.json()
