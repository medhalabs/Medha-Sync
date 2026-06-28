from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from features.contacts.models import Contact
from features.conversations.models import Conversation, ChannelType, ConversationStatus
from features.analytics.schemas import OverviewStats, ChannelVolume, AnalyticsOut
from datetime import datetime, timedelta


async def get_analytics(db: AsyncSession) -> AnalyticsOut:
    total_contacts = (await db.execute(select(func.count()).select_from(Contact))).scalar()
    total_conv = (await db.execute(select(func.count()).select_from(Conversation))).scalar()
    wa_conv = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.channel == ChannelType.whatsapp))).scalar()
    email_conv = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.channel == ChannelType.email))).scalar()
    open_conv = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.status != ConversationStatus.resolved))).scalar()

    today = datetime.utcnow().date()
    resolved_today = (await db.execute(
        select(func.count()).select_from(Conversation).where(
            and_(Conversation.status == ConversationStatus.resolved, func.date(Conversation.updated_at) == today)
        )
    )).scalar()

    volume = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        wa = (await db.execute(select(func.count()).select_from(Conversation).where(and_(Conversation.channel == ChannelType.whatsapp, func.date(Conversation.created_at) == d)))).scalar()
        em = (await db.execute(select(func.count()).select_from(Conversation).where(and_(Conversation.channel == ChannelType.email, func.date(Conversation.created_at) == d)))).scalar()
        volume.append(ChannelVolume(date=d.isoformat(), whatsapp=wa, email=em))

    return AnalyticsOut(
        overview=OverviewStats(
            total_contacts=total_contacts,
            total_conversations=total_conv,
            whatsapp_conversations=wa_conv,
            email_conversations=email_conv,
            open_conversations=open_conv,
            resolved_today=resolved_today,
        ),
        volume_last_7_days=volume,
    )
