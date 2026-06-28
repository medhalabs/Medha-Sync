from abc import ABC, abstractmethod
from typing import Any


class WhatsAppAdapter(ABC):
    @abstractmethod
    async def send_text(self, phone: str, text: str) -> dict:
        ...

    @abstractmethod
    async def send_interactive_list(self, phone: str, header: str, body: str, sections: list) -> dict:
        ...

    @abstractmethod
    async def send_document(self, phone: str, url: str, filename: str, caption: str = "") -> dict:
        ...

    @abstractmethod
    async def send_image(self, phone: str, url: str, caption: str = "") -> dict:
        ...
