/** Minimal markdown → React for legal pack bodies (headings, lists, paragraphs, links). */
export function LegalMarkdownBody({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n(?=## )/);
  return (
    <>
      {blocks.map((block, index) => (
        <LegalMarkdownBlock key={index} block={block.trim()} />
      ))}
    </>
  );
}

function LegalMarkdownBlock({ block }: { block: string }) {
  if (!block) return null;
  const lines = block.split('\n');
  const first = lines[0] ?? '';
  if (first.startsWith('## ')) {
    return (
      <>
        <h2>{first.replace(/^##\s+/, '')}</h2>
        <LegalMarkdownLines lines={lines.slice(1)} />
      </>
    );
  }
  if (first.startsWith('### ')) {
    return (
      <>
        <h3>{first.replace(/^###\s+/, '')}</h3>
        <LegalMarkdownLines lines={lines.slice(1)} />
      </>
    );
  }
  return <LegalMarkdownLines lines={lines} />;
}

function LegalMarkdownLines({ lines }: { lines: string[] }) {
  const elements: React.ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (!list.length) return;
    elements.push(
      <ul key={`ul-${elements.length}`}>
        {list.map((item, i) => (
          <li key={i}>{inlineMarkdown(item.replace(/^[-*]\s+/, ''))}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={`h3-${elements.length}`}>{trimmed.replace(/^###\s+/, '')}</h3>);
      continue;
    }
    if (trimmed.startsWith('|')) {
      flushList();
      elements.push(
        <pre key={`pre-${elements.length}`} className="legal-md-table">
          {trimmed}
        </pre>,
      );
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      list.push(trimmed);
      continue;
    }
    flushList();
    elements.push(<p key={`p-${elements.length}`}>{inlineMarkdown(trimmed)}</p>);
  }
  flushList();
  return <>{elements}</>;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const href = link[2]!;
      const isExternal = href.startsWith('http');
      return (
        <a key={i} href={href} rel={isExternal ? 'noopener noreferrer' : undefined}>
          {link[1]}
        </a>
      );
    }
    return part;
  });
}
