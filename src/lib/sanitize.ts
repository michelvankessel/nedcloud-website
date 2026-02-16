import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}