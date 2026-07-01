"""Normalize inbound email bodies for inbox display."""
from __future__ import annotations

import re
from html.parser import HTMLParser
from html import unescape

_URL_RE = re.compile(r"https?://[^\s<>\"']+", re.I)
_FOOTER_PATTERNS = (
    re.compile(r"^©\s*\d{4}", re.I),
    re.compile(r"unsubscribe", re.I),
    re.compile(r"^help\s*$", re.I),
    re.compile(r"^this email was intended for", re.I),
    re.compile(r"^you(?:'re| are) receiving .+ email", re.I),
    re.compile(r"^manage your notification", re.I),
    re.compile(r"^linkedin corporation", re.I),
    re.compile(r"^\d{4}\s+linkedin", re.I),
)


class _HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._link_stack: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in ("br", "hr"):
            self._parts.append("\n")
        elif tag in ("p", "div", "tr", "li", "h1", "h2", "h3", "h4"):
            if self._parts and not self._parts[-1].endswith("\n"):
                self._parts.append("\n")
        elif tag == "a":
            href = ""
            for key, value in attrs:
                if key.lower() == "href" and value:
                    href = value.strip()
                    break
            self._link_stack.append(href)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in ("p", "div", "tr", "li", "h1", "h2", "h3", "h4"):
            if self._parts and not self._parts[-1].endswith("\n"):
                self._parts.append("\n")
        elif tag == "a" and self._link_stack:
            href = self._link_stack.pop()
            if href and href.startswith(("http://", "https://", "mailto:")):
                self._parts.append(f"]({href})")

    def handle_data(self, data: str) -> None:
        text = unescape(data)
        if not text.strip():
            return
        if self._link_stack and self._link_stack[-1]:
            self._parts.append(f"[{text.strip()}")
        else:
            self._parts.append(text)

    def get_text(self) -> str:
        return "".join(self._parts)


def html_to_text(html: str) -> str:
    if not html or not html.strip():
        return ""
    cleaned = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", "", html)
    cleaned = re.sub(r"(?i)<br\s*/?>", "\n", cleaned)
    parser = _HTMLTextExtractor()
    parser.feed(cleaned)
    parser.close()
    text = parser.get_text()
    text = unescape(text)
    text = re.sub(r"\[(\s+)\]", r"\1", text)
    text = re.sub(r"\[\s*\]\([^)]+\)", "", text)
    return text


def _merge_label_url_lines(text: str) -> str:
    lines = text.splitlines()
    merged: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if i + 1 < len(lines):
            nxt = lines[i + 1].strip()
            if nxt.startswith(("http://", "https://")) and line and not line.startswith(("http://", "https://", "[")):
                label = line.rstrip(":").strip()
                if len(label) >= 80 and ". " in label:
                    head, tail_part = label.rsplit(".", 1)
                    tail = tail_part.strip().rstrip(":")
                    if tail and len(tail) < 80:
                        merged.append(f"{head.strip()}.")
                        merged.append(f"[{tail}]({nxt})")
                        i += 2
                        continue
                if label and len(label) < 80:
                    merged.append(f"[{label}]({nxt})")
                    i += 2
                    continue
        merged.append(lines[i])
        i += 1
    return "\n".join(merged)


def _drop_footer_lines(text: str) -> str:
    kept: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            kept.append("")
            continue
        if any(p.search(stripped) for p in _FOOTER_PATTERNS):
            continue
        if re.match(r"^help\s+https?://", stripped, re.I):
            continue
        if stripped.lower() == "help":
            continue
        if _URL_RE.fullmatch(stripped) and len(stripped) > 100:
            continue
        if stripped.startswith("http") and len(stripped) > 100:
            prev = kept[-1].strip() if kept else ""
            if prev.startswith("[") and "](" in prev:
                continue
        kept.append(line)
    return "\n".join(kept)


def _collapse_blank_lines(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def clean_email_body(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _merge_label_url_lines(text)
    text = _drop_footer_lines(text)
    text = _collapse_blank_lines(text)
    return text


def normalize_email_body(*, plain: str = "", html: str = "") -> str:
    candidates: list[str] = []
    if plain.strip():
        candidates.append(plain.strip())
    if html.strip():
        converted = html_to_text(html)
        if converted.strip():
            candidates.append(converted.strip())

    if not candidates:
        return ""

    body = max(candidates, key=len)
    return clean_email_body(body)
