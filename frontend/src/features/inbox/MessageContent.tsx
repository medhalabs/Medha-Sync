import { cleanEmailBodyForDisplay, flattenSegments, parseEmailSegments } from "./emailBody";

type Props = {
  content: string;
  direction: "inbound" | "outbound";
  sentAt: string;
  isEmail: boolean;
};

function TextBlock({ text, outbound }: { text: string; outbound: boolean }) {
  const lines = text.split("\n").filter((line, i, arr) => line.trim() || (i > 0 && arr[i - 1]?.trim()));
  if (!lines.length) return null;
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const isHeading = trimmed.length < 80 && !trimmed.startsWith("http") && trimmed.endsWith(".");
        return (
          <p
            key={i}
            className={
              isHeading && i === 0
                ? "text-[15px] font-semibold text-gray-900 leading-snug"
                : outbound
                  ? "text-sm text-white/95 whitespace-pre-wrap leading-relaxed"
                  : "text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"
            }
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function MessageContent({ content, direction, sentAt, isEmail }: Props) {
  const outbound = direction === "outbound";

  if (!isEmail) {
    return (
      <>
        {content && <p className="whitespace-pre-wrap">{content}</p>}
        <p className={`text-xs mt-1 ${outbound ? "text-brand-100" : "text-gray-400"}`}>{sentAt}</p>
      </>
    );
  }

  const cleaned = cleanEmailBodyForDisplay(content);
  const segments = flattenSegments(parseEmailSegments(cleaned));

  return (
    <>
      <div className="space-y-3">
        {segments.map((seg, i) => {
          if (seg.type === "link") {
            return (
              <a
                key={i}
                href={seg.href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  outbound
                    ? "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors w-fit"
                    : "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm w-fit"
                }
              >
                {seg.label}
              </a>
            );
          }
          return <TextBlock key={i} text={seg.value} outbound={outbound} />;
        })}
      </div>
      <p className={`text-xs mt-3 pt-2 border-t ${outbound ? "text-brand-100 border-white/20" : "text-gray-400 border-gray-100"}`}>
        {sentAt}
      </p>
    </>
  );
}
