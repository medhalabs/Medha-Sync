from core.config import settings
from features.whatsapp.adapter import WhatsAppAdapter


def get_whatsapp_adapter() -> WhatsAppAdapter:
    if settings.WA_PROVIDER == "meta":
        from features.whatsapp.meta_adapter import MetaAdapter
        return MetaAdapter()
    from features.whatsapp.baileys_adapter import BaileysAdapter
    return BaileysAdapter()
