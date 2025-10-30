const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttribute = (value: string) =>
  escapeHtml(value).replace(/\(/g, '&#40;').replace(/\)/g, '&#41;');

const applyInlineFormatting = (value: string) => {
  let formatted = escapeHtml(value);

  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, (_match, text, url) => {
    const safeText = escapeHtml(text);
    const safeUrl = escapeAttribute(url.trim());
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  });

  return formatted;
};

export const markdownToHtml = (markdown: string) => {
  if (!markdown) {
    return '<div></div>';
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let currentList: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (currentList) {
      htmlParts.push(`</${currentList}>`);
      currentList = null;
    }
  };

  const flushCodeBlock = () => {
    if (codeBuffer.length > 0) {
      htmlParts.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
      codeBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      htmlParts.push('<br />');
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeList();
      htmlParts.push('<hr />');
      continue;
    }

    if (trimmed.startsWith('>')) {
      closeList();
      const content = trimmed.replace(/^>\s?/, '');
      htmlParts.push(`<blockquote>${applyInlineFormatting(content)}</blockquote>`);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const content = applyInlineFormatting(headingMatch[2]);
      htmlParts.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (currentList !== 'ol') {
        closeList();
        currentList = 'ol';
        htmlParts.push('<ol>');
      }
      htmlParts.push(`<li>${applyInlineFormatting(orderedMatch[1])}</li>`);
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      if (currentList !== 'ul') {
        closeList();
        currentList = 'ul';
        htmlParts.push('<ul>');
      }
      htmlParts.push(`<li>${applyInlineFormatting(unorderedMatch[1])}</li>`);
      continue;
    }

    closeList();
    htmlParts.push(`<p>${applyInlineFormatting(trimmed)}</p>`);
  }

  if (inCodeBlock) {
    flushCodeBlock();
  }

  closeList();

  return `<div>${htmlParts.join('\n')}</div>`;
};

export type MarkdownConversion = {
  html: string;
  text: string;
};

export const convertMarkdown = (markdown: string): MarkdownConversion => ({
  text: markdown,
  html: markdownToHtml(markdown),
});


