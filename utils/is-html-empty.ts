/**
 * Detects if HTML content is empty.
 * Handles empty tags, whitespace, and HTML entities.
 */
export function isHtmlEmpty(html: string): boolean {
  if (!html) return true;

  let text = html.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#160;/g, ' ');
  text = text.replace(/&zwnj;/g, '');
  text = text.replace(/&zwj;/g, '');
  text = text.replace(/&#8203;/g, '');

  return text.trim().length === 0;
}
