import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a", "h2", "h3", "blockquote"] as const;

const ALLOWED_ATTR = ["href", "rel", "target"] as const;

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value, "https://example.invalid");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeProductHtml(html: string) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "svg", "math"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover", "style"],
    ALLOW_DATA_ATTR: false
  });

  return sanitized.replace(/<a\b([^>]*?)href=(["'])(.*?)\2/gi, (match, attrs, quote, href) => {
    if (isSafeHttpUrl(href)) return match;
    return `<a${attrs}href=${quote}#${quote}`;
  });
}
