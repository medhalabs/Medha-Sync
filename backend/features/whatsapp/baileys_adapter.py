import httpx
from features.whatsapp.adapter import WhatsAppAdapter
from core.config import settings


class BaileysAdapter(WhatsAppAdapter):
    def __init__(self):
        self.base_url = settings.BAILEYS_SERVICE_URL

    async def send_text(self, phone: str, text: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.base_url}/send/text", json={"phone": phone, "text": text})
            resp.raise_for_status()
            return resp.json()

    async def send_interactive_list(self, phone: str, header: str, body: str, sections: list) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/send/list",
                json={"phone": phone, "header": header, "body": body, "sections": sections},
            )
            resp.raise_for_status()
            return resp.json()

    async def send_document(self, phone: str, url: str, filename: str, caption: str = "") -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/send/document",
                json={"phone": phone, "url": url, "filename": filename, "caption": caption},
            )
            resp.raise_for_status()
            return resp.json()

    async def send_image(self, phone: str, url: str, caption: str = "") -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/send/image",
                json={"phone": phone, "url": url, "caption": caption},
            )
            resp.raise_for_status()
            return resp.json()
