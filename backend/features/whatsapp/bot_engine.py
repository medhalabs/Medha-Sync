from sqlalchemy.ext.asyncio import AsyncSession
from features.whatsapp.session import get_session, set_session, clear_session
from features.whatsapp.provider import get_whatsapp_adapter
from core.redis_client import get_redis
from core.storage import file_fetch_url
import json
from features.catalog.service import get_menu_tree, get_catalog_item, list_catalog_items
from features.contacts.service import create_contact
from features.contacts.schemas import ContactCreate
from features.conversations.service import get_or_create_conversation
from features.conversations.models import ChannelType, ConversationStatus
from features.messages.service import save_message
from features.messages.models import MessageDirection
from sqlalchemy import select
from features.contacts.models import Contact
import logging

logger = logging.getLogger(__name__)

GREETING_KEYWORDS = {"hi", "hello", "hey", "start", "menu", "help", "hii", "hiii"}
MAX_MENU_DEPTH = 10  # max nesting levels supported


async def _get_bot_config():
    """Fetch bot config from Redis. Returns default if not set."""
    redis = await get_redis()
    val = await redis.get("bot:config")
    if val:
        config = json.loads(val)
        return {
            "welcome_message": config.get("welcome_message", "Thanks for reaching out! Our team will be in touch with you shortly."),
            "menu_header": config.get("menu_header", "*Welcome!* 👋"),
        }
    return {
        "welcome_message": "Thanks for reaching out! Our team will be in touch with you shortly.",
        "menu_header": "*Welcome!* 👋",
    }


async def handle_inbound(db: AsyncSession, phone: str, message_text: str, wa_message_id: str = None, reply_jid: str = None):
    adapter = get_whatsapp_adapter()

    # 1. Ensure contact exists
    result = await db.execute(select(Contact).where(Contact.phone == phone))
    contact = result.scalar_one_or_none()
    if not contact:
        contact = await create_contact(db, ContactCreate(phone=phone, source="whatsapp"))

    # 2. Ensure open conversation exists
    conv = await get_or_create_conversation(db, contact.id, ChannelType.whatsapp)

    # 3. Save the inbound message — commit regardless of what bot does
    try:
        await save_message(
            db,
            conversation_id=conv.id,
            contact_id=contact.id,
            direction=MessageDirection.inbound,
            content=message_text,
            wa_message_id=wa_message_id,
        )
        await db.commit()
    except Exception:
        logger.exception("Failed to save inbound message from %s", phone)
        await db.rollback()
        return

    # 4. Run keyword automations
    try:
        from features.automations.service import run_keyword_automations
        await run_keyword_automations(db, contact.id, message_text)
        await db.commit()
    except Exception:
        logger.exception("Automation error for phone %s", phone)
        await db.rollback()

    # 5. If agent has taken over, don't bot-reply
    if conv.status == ConversationStatus.agent:
        return

    # 6. Run bot menu logic (best-effort — message already saved)
    # Use reply_jid (full JID incl. @lid) for sending; fall back to phone
    send_to = reply_jid or phone
    try:
        await _run_bot(db, send_to, message_text, contact.id, conv.id, adapter)
    except Exception:
        logger.exception("Bot engine error for phone %s", phone)


async def _get_trigger_keyword() -> str:
    try:
        redis = await get_redis()
        val = await redis.get("bot:config")
        if val:
            return json.loads(val).get("trigger_keyword", "").strip().lower()
    except Exception:
        pass
    return ""


async def _run_bot(db, phone, message_text, contact_id, conv_id, adapter):
    session = await get_session(phone)
    text = message_text.strip()
    text_lower = text.lower()

    trigger_keyword = await _get_trigger_keyword()

    if trigger_keyword:
        # Custom trigger mode: only the configured keyword (or being in a session) activates the bot
        if not session:
            if text_lower == trigger_keyword:
                await _send_main_menu(db, phone, contact_id, conv_id, adapter)
            # else: normal conversation — message already saved, no bot reply
            return
        # If already in a session and they send the trigger keyword → restart menu
        if text_lower == trigger_keyword:
            await clear_session(phone)
            await _send_main_menu(db, phone, contact_id, conv_id, adapter)
            return
    else:
        # Default mode: standard greeting keywords trigger the menu
        if text_lower in GREETING_KEYWORDS or not session:
            await _send_main_menu(db, phone, contact_id, conv_id, adapter)
            return

    node = session.get("node")
    items_ids = session.get("items", [])

    # Number reply: works for both main_menu and sub_menu
    current_depth = session.get("depth", 0)
    if text.isdigit() and items_ids:
        idx = int(text) - 1
        if 0 <= idx < len(items_ids):
            item = await get_catalog_item(db, items_ids[idx])
            if item:
                # Check if this item has children and depth limit not reached
                children = await list_catalog_items(db, parent_id=item.id)
                active_children = [c for c in children if c.is_active]
                if active_children and current_depth < MAX_MENU_DEPTH - 1:
                    await _send_sub_menu(db, phone, contact_id, conv_id, adapter, item, active_children, depth=current_depth + 1)
                else:
                    await _send_catalog_item(db, phone, contact_id, conv_id, adapter, item)
                    await clear_session(phone)
                return
        # Out-of-range number → re-show current menu
        await _resend_current_menu(db, phone, contact_id, conv_id, adapter, session)
        return

    # ID-based selection from interactive list
    if node in ("main_menu", "sub_menu") and len(text) > 10:
        item = await get_catalog_item(db, text)
        if item:
            children = await list_catalog_items(db, parent_id=item.id)
            active_children = [c for c in children if c.is_active]
            if active_children:
                await _send_sub_menu(db, phone, contact_id, conv_id, adapter, item, active_children)
            else:
                await _send_catalog_item(db, phone, contact_id, conv_id, adapter, item)
                await clear_session(phone)
            return

    # "back" in sub-menu → go back to main menu
    if text_lower in {"back", "0", "main", "home"} and node == "sub_menu":
        await _send_main_menu(db, phone, contact_id, conv_id, adapter)
        return

    # Unrecognised → re-show current menu
    await _resend_current_menu(db, phone, contact_id, conv_id, adapter, session)


async def _resend_current_menu(db, phone, contact_id, conv_id, adapter, session):
    node = session.get("node") if session else None
    if node == "sub_menu":
        parent_id = session.get("parent_id")
        parent_title = session.get("parent_title", "")
        items_ids = session.get("items", [])
        # Reload children
        from features.catalog.models import CatalogItem
        from sqlalchemy import select as sa_select
        result = await db.execute(sa_select(CatalogItem).where(CatalogItem.id.in_(items_ids), CatalogItem.is_active == True))
        children = result.scalars().all()
        if children:
            # Fake a parent object with title
            class _FakeItem:
                title = parent_title
                id = parent_id
            await _send_sub_menu(db, phone, contact_id, conv_id, adapter, _FakeItem(), children, resend=True)
            return
    await _send_main_menu(db, phone, contact_id, conv_id, adapter)


async def _send_main_menu(db, phone, contact_id, conv_id, adapter):
    tree = await get_menu_tree(db)
    config = await _get_bot_config()

    if not tree:
        reply = config["welcome_message"]
        await _save_and_send(db, conv_id, contact_id, phone, adapter, reply)
        return

    item_ids = [str(item.id) for item in tree]

    lines = [f"{config['menu_header']}\n\nReply with a number:\n"]
    for i, item in enumerate(tree, 1):
        children = await list_catalog_items(db, parent_id=item.id)
        has_sub = any(c.is_active for c in children)
        suffix = " ›" if has_sub else ""
        lines.append(f"*{i}.* {item.title}{suffix}")
    lines.append("\nType *menu* anytime to return here.")
    text_menu = "\n".join(lines)

    await _save_and_send(db, conv_id, contact_id, phone, adapter, text_menu)

    # Try interactive list (Business API only — non-fatal if fails)
    rows = [
        {"id": str(item.id), "title": item.title[:24], "description": (item.description or "")[:72]}
        for item in tree
    ]
    try:
        await adapter.send_interactive_list(
            phone, config["menu_header"].replace("*", "").replace("👋", "").strip(), "Please select a service:", [{"title": "Our Services", "rows": rows}]
        )
    except Exception:
        pass  # text fallback already sent above

    await set_session(phone, {"node": "main_menu", "items": item_ids})


async def _send_sub_menu(db, phone, contact_id, conv_id, adapter, parent_item, children, resend=False, depth=1):
    item_ids = [str(c.id) for c in children]

    lines = [f"*{parent_item.title}*\n\nChoose an option:\n"]
    for i, child in enumerate(children, 1):
        # Only show › if depth allows going deeper
        has_sub = False
        if depth < MAX_MENU_DEPTH - 1:
            grandchildren = await list_catalog_items(db, parent_id=child.id)
            has_sub = any(g.is_active for g in grandchildren)
        suffix = " ›" if has_sub else ""
        lines.append(f"*{i}.* {child.title}{suffix}")
    lines.append("\nType *0* or *back* to return to main menu.")
    text_menu = "\n".join(lines)

    await _save_and_send(db, conv_id, contact_id, phone, adapter, text_menu)

    rows = [
        {"id": str(c.id), "title": c.title[:24], "description": (c.description or "")[:72]}
        for c in children
    ]
    try:
        await adapter.send_interactive_list(
            phone, parent_item.title, "Select an option:", [{"title": parent_item.title, "rows": rows}]
        )
    except Exception:
        pass

    await set_session(phone, {
        "node": "sub_menu",
        "items": item_ids,
        "depth": depth,
        "parent_id": str(parent_item.id),
        "parent_title": parent_item.title,
    })


async def _send_catalog_item(db, phone, contact_id, conv_id, adapter, item):
    parts = [f"*{item.title}*"]
    if item.description:
        parts.append(item.description)
    if item.link_url:
        parts.append(f"🔗 {item.link_url}")
    parts.append("\nType *menu* to see all services.")
    reply = "\n\n".join(parts)

    await _save_and_send(db, conv_id, contact_id, phone, adapter, reply)

    try:
        if item.image_url:
            await adapter.send_image(
                phone,
                file_fetch_url(item.image_url),
                caption=item.title,
            )
        if item.brochure_url:
            ext = ".pdf"
            if "." in item.brochure_url.rsplit("/", 1)[-1]:
                ext = "." + item.brochure_url.rsplit(".", 1)[-1]
            await adapter.send_document(
                phone,
                file_fetch_url(item.brochure_url),
                f"{item.title}{ext}",
                item.description or "",
            )
    except Exception:
        logger.warning("WA delivery failed for catalog item to %s", phone)


async def _save_and_send(db, conv_id, contact_id, phone, adapter, text):
    """Save outbound message to DB first, then attempt WA delivery."""
    await save_message(db, conv_id, contact_id, MessageDirection.outbound, text)
    await db.commit()
    try:
        await adapter.send_text(phone, text)
    except Exception:
        logger.warning("WA text delivery failed to %s", phone)
