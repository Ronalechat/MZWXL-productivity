export function Linkified({ text }: { text: string }) {
  const urlRe = /https?:\/\/[^\s]+/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a
        key={m.index}
        href={m[0]}
        target="_blank"
        rel="noreferrer"
        style={{ color: "var(--accent)", textDecoration: "underline", wordBreak: "break-all" }}
      >
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
