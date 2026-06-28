from sqlalchemy.ext.asyncio import AsyncSession
from features.whatsapp.session import get_session, set_session, clear_session
from features.whatsapp.provider import get_whatsapp_adapter
from features.catalog.service import get_menu_tree, get_catalog_item
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


async def handle_inbound(db: AsyncSession, phone: str, message_text: str, wa_message_id: str = None):
    adapter = get_whatsapp_adapter()

    # 1. Ensure contact exists
    result = await db.execute(select(Contact).where(Contact.phone == phone))
    contact = result.scalar_one_or_none()
    if not contact:
        contact = await create_contact(db, ContactCreate(phone=phone, source="whatsapp"))

    # 2. Ensure open conversation exists
    conv = await get_or_create_conversation(db, contact.id, ChannelType.whatsapp)

    # 3. Save the inbound message — commit this regardless of what the bot does
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

    # 4. Run keyword automations (always, regardless of conversation status)
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

    # 6. Run bot menu logic (errors here are best-effort — message is already saved)
    try:
        await _run_bot(db, phone, message_text, contact.id, conv.id, adapter)
    except Exception:
        logger.exception("Bot engine error for phone %s", phone)


async def _run_bot(db, phone, message_text, contact_id, conv_id, adapter):
    session = await get_session(phone)
    text_lower = message_text.strip().lower()

    # Greeting or no session → show main menu
    if text_lower in GREETING_KEYWORDS or not session:
        await _send_main_menu(db, phone, contact_id, conv_id, adapter)
        return

    # Number selection from text-based fallback menu
    if text_lower.isdigit() and session.get("items"):
        idx = int(text_lower) - 1
        items = session.get("items", [])
        if 0 <= idx < len(items):
            item = await get_catalog_item(db, items[idx])
            if item:
                await _send_catalog_item(db, phone, contact_id, conv_id, adapter, item)
                await clear_session(phone)
                return

    # ID-based selection (from interactive list)
    if session.get("node") == "main_menu":
        item = await get_catalog_item(db, message_text.strip())
        if item:
            await _send_catalog_item(db, phone, contact_id, conv_id, adapter, item)
            await clear_session(phone)
            return

    # Unrecognised input → re-show menu
    await _send_main_menu(db, phone, contact_id, conv_id, adapter)


async def _send_catalog_item(db, phone, contact_id, conv_id, adapter, item):
    if item.brochure_url:
        await adapter.send_document(phone, item.brochure_url, f"{item.title}.pdf", item.description or "")
        reply = f"Here is the brochure for *{item.title}*.\n\nType *menu* to see all services."
    else:
        reply = f"*{item.title}*\n\n{item.description or 'No details available.'}\n\nType *menu* to see all services."
    await adapter.send_text(phone, reply)
    await save_message(db, conv_id, contact_id, MessageDirection.outbound, reply)
    await db.commit()


async def _send_main_menu(db, phone, contact_id, conv_id, adapter):
    tree = await get_menu_tree(db)

    if not tree:
        reply = "Welcome to Medha! Our team will be in touch with you shortly."
        await adapter.send_text(phone, reply)
        await save_message(db, conv_id, contact_id, MessageDirection.outbound, reply)
        await db.commit()
        return

    item_ids = [str(item.id) for item in tree[:10]]

    # Try interactive list (WhatsApp Business accounts)
    rows = [
        {"id": str(item.id), "title": item.title[:24], "description": (item.description or "")[:72]}
        for item in tree[:10]
    ]
    sections = [{"title": "Our Services", "rows": rows}]

    sent_interactive = False
    try:
        await adapter.send_interactive_list(
            phone, "Welcome to Medha", "Please select a service to learn more:", sections
        )
        sent_interactive = True
    except Exception:
        logger.warning("Interactive list failed for %s — falling back to text menu", phone)

    if not sent_interactive:
        # Text-based numbered menu (works on all WhatsApp accounts)
        menu_lines = ["*Welcome to Medha!*\n\nReply with a number to learn more:\n"]
        for i, item in enumerate(tree[:10], 1):
            menu_lines.append(f"*{i}.* {item.title}")
        menu_lines.append("\nReply with a number, e.g. *1*")
        reply = "\n".join(menu_lines)
        await adapter.send_text(phone, reply)
        await save_message(db, conv_id, contact_id, MessageDirection.outbound, reply)
        await db.commit()

    await set_session(phone, {"node": "main_menu", "items": item_ids})
