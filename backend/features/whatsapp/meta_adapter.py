import httpx
from features.whatsapp.adapter import WhatsAppAdapter
from core.config import settings


class MetaAdapter(WhatsAppAdapter):
    BASE = "https://graph.facebook.com/v19.0"

    def __init__(self):
        self.phone_number_id = settings.META_PHONE_NUMBER_ID
        self.token = settings.META_ACCESS_TOKEN
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    async def send_text(self, phone: str, text: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE}/{self.phone_number_id}/messages",
                headers=self.headers,
                json={"messaging_product": "whatsapp", "to": phone, "type": "text", "text": {"body": text}},
            )
            resp.raise_for_status()
            return resp.json()

    async def send_interactive_list(self, phone: str, header: str, body: str, sections: list) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE}/{self.phone_number_id}/messages",
                headers=self.headers,
                json={
                    "messaging_product": "whatsapp",
                    "to": phone,
                    "type": "interactive",
                    "interactive": {
                        "type": "list",
                        "header": {"type": "text", "text": header},
                        "body": {"text": body},
                        "action": {"button": "Select", "sections": sections},
                    },
                },
            )
            resp.raise_for_status()
            return resp.json()

    async def send_document(self, phone: str, url: str, filename: str, caption: str = "") -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE}/{self.phone_number_id}/messages",
                headers=self.headers,
                json={
                    "messaging_product": "whatsapp",
                    "to": phone,
                    "type": "document",
                    "document": {"link": url, "filename": filename, "caption": caption},
                },
            )
            resp.raise_for_status()
            return resp.json()

    async def send_image(self, phone: str, url: str, caption: str = "") -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE}/{self.phone_number_id}/messages",
                headers=self.headers,
                json={
                    "messaging_product": "whatsapp",
                    "to": phone,
                    "type": "image",
                    "image": {"link": url, "caption": caption},
                },
            )
            resp.raise_for_status()
            return resp.json()
