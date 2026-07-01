/** Format email message bodies for mail-like inbox display. */

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const RAW_URL = /https?:\/\/[^\s<>"]+/g;

const FOOTER_LINE =
  /^(©|unsubscribe|help(\s+https?://|\s*$)|this email was intended|you(?:'re| are) receiving|manage your notification|linkedin corporation)/i;

function mergeLabelUrlLines(text: string): string {
  const lines = text.split("\n");
  const merged: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const next = lines[i + 1]?.trim() ?? "";
    if (next.startsWith("http") && line && !line.startsWith("http") && !line.startsWith("[")) {
      let label = line.replace(/:$/, "").trim();
      if (label.length >= 80 && label.includes(". ")) {
        const dot = label.lastIndexOf(".");
        const head = label.slice(0, dot + 1).trim();
        const tail = label.slice(dot + 1).trim().replace(/:$/, "");
        if (tail && tail.length < 80) {
          merged.push(head);
          merged.push(`[${tail}](${next})`);
          i += 2;
          continue;
        }
      }
      if (label && label.length < 80) {
        merged.push(`[${label}](${next})`);
        i += 2;
        continue;
      }
    }
    merged.push(lines[i]);
    i += 1;
  }
  return merged.join("\n");
}

export function cleanEmailBodyForDisplay(content: string): string {
  if (!content) return "";
  let text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = mergeLabelUrlLines(text);
  const kept = text.split("\n").filter((line) => {
    const s = line.trim();
    if (!s) return true;
    if (FOOTER_LINE.test(s)) return false;
    if (/^https?:\/\//i.test(s) && s.length > 100) return false;
    return true;
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

type Segment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string };

export function parseEmailSegments(content: string): Segment[] {
  const cleaned = cleanEmailBodyForDisplay(content);
  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  MARKDOWN_LINK.lastIndex = 0;
  while ((match = MARKDOWN_LINK.exec(cleaned)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: cleaned.slice(last, match.index) });
    }
    segments.push({ type: "link", label: match[1].trim(), href: match[2] });
    last = match.index + match[0].length;
  }

  if (last < cleaned.length) {
    segments.push({ type: "text", value: cleaned.slice(last) });
  }

  if (segments.length === 0 && cleaned) {
    segments.push({ type: "text", value: cleaned });
  }

  return segments;
}

export function linkifyPlainText(text: string): Segment[] {
  const parts: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  RAW_URL.lastIndex = 0;
  while ((match = RAW_URL.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    const href = match[0];
    let label = href;
    try {
      label = href.length > 48 ? `${new URL(href).hostname.replace(/^www\./, "")}…` : href;
    } catch {
      label = href.length > 48 ? `${href.slice(0, 40)}…` : href;
    }
    parts.push({ type: "link", label, href });
    last = match.index + href.length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}

export function flattenSegments(segments: Segment[]): Segment[] {
  const flat: Segment[] = [];
  for (const seg of segments) {
    if (seg.type === "text" && seg.value.includes("http")) {
      flat.push(...linkifyPlainText(seg.value));
    } else {
      flat.push(seg);
    }
  }
  return flat;
}
